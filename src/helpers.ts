import { getSRPParams } from '@mtproto/core';
import * as readline from 'readline';
import { api } from './api';

async function readAuthCode(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Code ', (answer: string) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function readPassword(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Password ', (answer: string) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function getUser() {
    try {
        const user = await api.call('users.getFullUser', {
            id: {
                _: 'inputUserSelf',
            },
        });

        return user;
    } catch (error) {
        return null;
    }
}

function sendCode(phoneNumber: string) {
    return api.call('auth.sendCode', {
        phone_number: phoneNumber,
        settings: {
            _: 'codeSettings',
        },
    });
}

function signIn(phoneCode: string, phoneNumber: string, phoneCodeHash: string) {
    return api.call('auth.signIn', {
        phone_code: phoneCode,
        phone_number: phoneNumber,
        phone_code_hash: phoneCodeHash,
    });
}

function getPassword() {
    return api.call('account.getPassword', null, null);
}

function checkPassword(srp_id: string, A: Uint8Array, M1: Uint8Array) {
    return api.call('auth.checkPassword', {
        password: {
            _: 'inputCheckPasswordSRP',
            srp_id,
            A,
            M1,
        },
    });
}

export async function login() {
    const user = await getUser();

    if (!user) {
        const { phone_code_hash } = await sendCode(process.env.PHONE_NUMBER);
        const phoneCode = await readAuthCode();

        try {
            const authResult = await signIn(phoneCode, process.env.PHONE_NUMBER, phone_code_hash);
            return authResult;
        } catch (error) {
            if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
                return;
            }

            const { srp_id, current_algo, srp_B } = await getPassword();
            const { g, p, salt1, salt2 } = current_algo;
            const password = await readPassword();

            const { A, M1 } = await getSRPParams({
                g,
                p,
                salt1,
                salt2,
                gB: srp_B,
                password,
            });

            const authResult = await checkPassword(srp_id, A, M1);
            return authResult;
        }
    }

    return user;
}
