import { registerUser } from '../services/authService.js';
const main = async () => {
    try {
        const result = await registerUser({
            email: 'demo@regalpawn.com',
            password: 'Password123!',
            firstName: 'Ava',
            lastName: 'Stein',
            role: 'admin',
        });
        console.log('Seeded demo user:', result.user.email);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Failed to seed demo user:', error.message);
        }
        else {
            console.error('Unknown error seeding demo user');
        }
        process.exitCode = 1;
    }
};
void main();
