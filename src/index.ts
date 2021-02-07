import { api } from './api';
import { login } from './helpers';

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
    await login();

    const messagesGetAllChatsResponse = await api.call('messages.getAllChats', {
        except_ids: [],
    });

    console.log(messagesGetAllChatsResponse);
})();
