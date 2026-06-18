const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const user = await User.findOne({ mobile });

        if (user && (await user.matchPassword(password))) {
            if (user.status !== 'active') {
                return res.status(401).json({ message: 'User is inactive' });
            }
            res.json({
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid mobile or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    loginUser,
};
