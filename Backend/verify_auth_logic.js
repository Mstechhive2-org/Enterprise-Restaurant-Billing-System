import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant_billing';

const verifyAuthLimit = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const TEST_USERNAME = 'test_limit_user';
        const TEST_PASSWORD = 'password123';

        // 1. Cleanup old test user
        await User.deleteOne({ username: TEST_USERNAME });

        // 2. Create new test user with Admin role (Max 1 login by default)
        const user = new User({
            username: TEST_USERNAME,
            password: TEST_PASSWORD, // Will be hashed by pre-save
            role: 'Admin',
            activeSessions: []
        });
        await user.save();
        console.log('Test user created');

        // 3. Set limit to 1 for Admin in env (simulated)
        process.env.ADMIN_MAX_CONCURRENT_LOGINS = '1';

        // 4. Perform First Login (Simulation)
        // Logic copied from authController
        const adminMaxLogins = parseInt(process.env.ADMIN_MAX_CONCURRENT_LOGINS || '1', 10);
        let maxLogins = adminMaxLogins;

        console.log(`Max logins allowed: ${maxLogins}`);

        // Login 1
        console.log('--- Attempting Login 1 ---');
        let currentUser = await User.findOne({ username: TEST_USERNAME });
        if (currentUser.activeSessions.length >= maxLogins) {
            console.error('FAIL: Login 1 blocked unexpectedly');
        } else {
            currentUser.activeSessions.push({
                accessToken: 'token1',
                refreshToken: 'refresh1',
                lastActive: new Date()
            });
            await currentUser.save();
            console.log('SUCCESS: Login 1 allowed');
        }

        // 5. Perform Second Login (Should Fail)
        console.log('--- Attempting Login 2 ---');
        currentUser = await User.findOne({ username: TEST_USERNAME });

        // Check Limit
        if (currentUser.activeSessions.length >= maxLogins) {
            console.log('SUCCESS: Login 2 blocked as expected');
        } else {
            console.error('FAIL: Login 2 allowed unexpectedly');
            currentUser.activeSessions.push({
                accessToken: 'token2',
                refreshToken: 'refresh2',
                lastActive: new Date()
            });
            await currentUser.save();
        }

        // 6. Logout First Session
        console.log('--- Logging out Session 1 ---');
        await User.findOneAndUpdate({ username: TEST_USERNAME }, {
            $pull: { activeSessions: { accessToken: 'token1' } }
        });
        console.log('Logged out');

        // 7. Perform Login 3 (Should Success now)
        console.log('--- Attempting Login 3 ---');
        currentUser = await User.findOne({ username: TEST_USERNAME });
        if (currentUser.activeSessions.length >= maxLogins) {
            console.error('FAIL: Login 3 blocked unexpectedly');
        } else {
            console.log('SUCCESS: Login 3 allowed');
        }

        console.log('Verification Complete');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyAuthLimit();
