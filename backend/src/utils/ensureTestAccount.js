import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dbService from './dbService.js';

const TEST_EMAIL = (process.env.TEST_ACCOUNT_EMAIL || 'test@gmail.com').toLowerCase();
const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'test@123';
const ENABLE_TEST_ACCOUNT = process.env.ENABLE_TEST_ACCOUNT !== 'false';

const ensureJsonProfile = async (user) => {
    const existing = await dbService.find('users', (item) => item.id === String(user._id));
    if (existing) {
        await dbService.update('users', existing.id, {
            email: user.email,
            name: user.name || existing.name || 'Test User',
            updatedAt: new Date().toISOString()
        });
        return;
    }

    await dbService.insert('users', {
        id: String(user._id),
        email: user.email,
        name: user.name || 'Test User',
        gender: '',
        skills: [],
        primarySkills: [],
        secondarySkills: [],
        onboardingCompleted: false,
        resumeText: '',
        resumeSkills: [],
        resumeProjects: [],
        resumeEducation: '',
        resumeKeywords: [],
        updatedAt: new Date().toISOString()
    });
};

export const ensureTestAccount = async () => {
    if (!ENABLE_TEST_ACCOUNT) return;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);

    const existing = await User.findOne({ email: TEST_EMAIL });
    if (existing) {
        existing.name = existing.name || 'Test User';
        existing.password = hashedPassword;
        existing.isVerified = true;
        await existing.save();
        await ensureJsonProfile(existing);
        console.log(`[Startup] Test account synced: ${TEST_EMAIL}`);
        return;
    }

    const created = new User({
        name: 'Test User',
        email: TEST_EMAIL,
        password: hashedPassword,
        isVerified: true
    });

    await created.save();
    await ensureJsonProfile(created);
    console.log(`[Startup] Test account ready: ${TEST_EMAIL}`);
};

export default ensureTestAccount;
