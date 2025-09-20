import { io } from 'socket.io-client';

export function connectWS() {
    return io('https://sunona-groupchat-server.onrender.com/');
}
