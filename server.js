const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// মিডলওয়্যার
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// আপলোড ফোল্ডার তৈরি করা না থাকলে তা স্বয়ংক্রিয়ভাবে তৈরি হবে
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer স্টোরেজ কনফিগারেশন (ফাইলের নাম ইউনিক রাখার জন্য)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// ফাইল সাইজ লিমিটেড করা (যেমন: ২০০ এমবি সর্বোচ্চ)
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 } // ২০০ MB
});

// স্ট্যাটিক ফোল্ডার কনফিগারেশন
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(uploadDir));

// ফাইল আপলোড এন্ডপয়েন্ট
app.post('/upload', upload.single('fileToUpload'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'কোনো ফাইল সিলেক্ট করা হয়নি!' });
        }
        
        // ফাইলের ডিরেক্ট লিংক তৈরি
        const fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;
        
        res.status(200).json({ 
            message: 'ফাইল সফলভাবে আপলোড হয়েছে!', 
            filename: req.file.filename,
            size: req.file.size,
            url: fileUrl 
        });
    } catch (err) {
        res.status(500).json({ error: 'সার্ভার সাইডে কোনো সমস্যা হয়েছে: ' + err.message });
    }
});

// সার্ভার স্টার্ট
app.listen(PORT, () => {
    console.log(`সার্ভার সফলভাবে চালু হয়েছে: http://localhost:${PORT}`);
});
