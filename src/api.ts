import { MTProto } from '@mtproto/core';
import { sleep } from '@mtproto/core/src/utils/common';

const mtproto = new MTProto({
    api_id: Number(process.env.API_ID),
    api_hash: process.env.API_HASH,
});

export const api = {
    call(
        method: string,
        params: Record<string, string | number | boolean | Record<string, string | number | boolean | Uint8Array> | Array<string>>,
        options = {},
    ) {
        // @ts-ignore
        return mtproto.call(method, params, options).catch(async (error) => {
            console.log(`${method} error:`, error);

            // @ts-ignore
            const { error_code, error_message } = error;

            if (error_code === 420) {
                const seconds = +error_message.split('FLOOD_WAIT_')[1];
                const ms = seconds * 1000;

                await sleep(ms);

                return this.call(method, params, options);
            }

            if (error_code === 303) {
                const [type, dcId] = error_message.split('_MIGRATE_');

                // If auth.sendCode call on incorrect DC need change default DC, because call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
                if (type === 'PHONE') {
                    await mtproto.setDefaultDc(+dcId);
                } else {
                    options = {
                        ...options,
                        dcId: +dcId,
                    };
                }

                return this.call(method, params, options);
            }

            return Promise.reject(error);
        });
    },
};
