import { useEffect, useRef, useState } from "react";
import { connectWS } from "./ws";

export default function App() {
    const timer = useRef(null);
    const socket = useRef(null);
    const messagesEndRef = useRef(null);
    const [userName, setUserName] = useState("");
    const [showNamePopup, setShowNamePopup] = useState(true);
    const [inputName, setInputName] = useState("");
    const [typers, setTypers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const quickEmojis = ["😊", "😂", "👍", "❤️", "🔥", "✨", "💯", "🚀"];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        socket.current = connectWS();

        socket.current.on("connect", () => {
            setIsConnected(true);

            socket.current.on("roomNotice", (userName) => {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        type: "system",
                        text: `${userName} joined the conversation`,
                        ts: Date.now(),
                    },
                ]);
            });

            socket.current.on("chatMessage", (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            socket.current.on("typing", (userName) => {
                setTypers((prev) => {
                    const isExist = prev.find((typer) => typer === userName);
                    if (!isExist) {
                        return [...prev, userName];
                    }
                    return prev;
                });
            });

            socket.current.on("stopTyping", (userName) => {
                setTypers((prev) => prev.filter((typer) => typer !== userName));
            });
        });

        socket.current.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            socket.current.off("roomNotice");
            socket.current.off("chatMessage");
            socket.current.off("typing");
            socket.current.off("stopTyping");
            socket.current.off("connect");
            socket.current.off("disconnect");
        };
    }, []);

    useEffect(() => {
        if (text && userName) {
            socket.current.emit("typing", userName);
            clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => {
            if (userName) {
                socket.current.emit("stopTyping", userName);
            }
        }, 1000);

        return () => {
            clearTimeout(timer.current);
        };
    }, [text, userName]);

    function formatTime(ts) {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    }

    function handleNameSubmit(e) {
        e.preventDefault();
        const trimmed = inputName.trim();
        if (!trimmed) return;

        socket.current.emit("joinRoom", trimmed);
        setUserName(trimmed);
        setShowNamePopup(false);

        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    type: "system",
                    text: `Welcome to SunoNa, ${trimmed}!`,
                    ts: Date.now(),
                },
            ]);
        }, 500);
    }

    function sendMessage() {
        const t = text.trim();
        if (!t) return;

        const msg = {
            id: Date.now(),
            sender: userName,
            text: t,
            ts: Date.now(),
        };
        setMessages((m) => [...m, msg]);
        socket.current.emit("chatMessage", msg);
        setText("");
    }

    function addEmoji(emoji) {
        setText((prev) => prev + emoji);
        setShowEmojiPicker(false);
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/5 to-transparent"></div>

            {/* NAME POPUP - Professional Entry */}
            {showNamePopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full mx-4 p-10 border border-white/20 relative overflow-hidden">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-3xl"></div>

                        <div className="relative z-10">
                            <div className="text-center mb-10">
                                {/* Premium SunoNa Logo */}
                                <div className="inline-block">
                                    <div className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2 tracking-tight">
                                        SunoNa
                                    </div>
                                    <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-3">
                                    Welcome to the Future of Chat
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    Enter your name to join the conversation
                                </p>
                            </div>

                            <form
                                onSubmit={handleNameSubmit}
                                className="space-y-6"
                            >
                                <div className="relative group">
                                    <input
                                        autoFocus
                                        value={inputName}
                                        onChange={(e) =>
                                            setInputName(e.target.value)
                                        }
                                        className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg outline-none focus:border-blue-500 transition-all placeholder-gray-400 bg-white/80 backdrop-blur group-hover:border-gray-300"
                                        placeholder="Enter your name..."
                                        maxLength={25}
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!inputName.trim()}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="relative flex items-center justify-center">
                                        Join SunoNa
                                        <svg
                                            className="w-5 h-5 ml-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                                            />
                                        </svg>
                                    </span>
                                </button>
                            </form>

                            <div className="text-center mt-8">
                                <p className="text-sm text-gray-500">
                                    Connect • Collaborate • Create
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CHAT INTERFACE - Clean Professional Design */}
            {!showNamePopup && (
                <div className="w-full max-w-6xl h-[95vh] bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col relative">
                    {/* Clean Professional Header */}
                    <div className="bg-gradient-to-r from-slate-800/90 via-gray-800/90 to-slate-800/90 backdrop-blur-xl p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-lg">
                                            {userName[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800"></div>
                                </div>

                                <div>
                                    <h2 className="text-white font-bold text-xl flex items-center">
                                        SunoNa
                                        <span className="ml-3 px-3 py-1 bg-blue-500/20 rounded-full text-xs font-medium text-blue-300">
                                            LIVE
                                        </span>
                                    </h2>
                                    <p className="text-gray-300 text-sm">
                                        Welcome back, {userName}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Clean Connection Status */}
                                <div
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
                                        isConnected
                                            ? "bg-green-500/20 border-green-500/30 text-green-300"
                                            : "bg-red-500/20 border-red-500/30 text-red-300"
                                    }`}
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full ${
                                            isConnected
                                                ? "bg-green-400"
                                                : "bg-red-400"
                                        } animate-pulse`}
                                    ></div>
                                    <span className="text-xs font-medium">
                                        {isConnected
                                            ? "Connected"
                                            : "Disconnected"}
                                    </span>
                                </div>

                                {/* Settings Button */}
                                <button
                                    onClick={() => setShowNamePopup(true)}
                                    className="text-gray-300 hover:text-white transition-colors bg-white/10 rounded-xl p-3 hover:bg-white/20 border border-white/20"
                                    title="Settings"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20">
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                {msg.type === "system" ? (
                                    <div className="flex justify-center">
                                        <div className="bg-blue-500/20 backdrop-blur text-blue-300 px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30">
                                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                                            {msg.text}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`flex ${
                                            msg.sender === userName
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-md lg:max-w-lg px-5 py-4 rounded-2xl relative group ${
                                                msg.sender === userName
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                                                    : "bg-white/10 backdrop-blur-xl text-white border border-white/20 shadow-lg"
                                            } transform hover:scale-[1.02] transition-all duration-200`}
                                        >
                                            {msg.sender !== userName && (
                                                <div className="text-xs font-bold text-blue-300 mb-2 flex items-center">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                                    {msg.sender}
                                                </div>
                                            )}

                                            <div className="break-words text-sm leading-relaxed">
                                                {msg.text}
                                            </div>

                                            <div
                                                className={`text-xs mt-2 flex items-center ${
                                                    msg.sender === userName
                                                        ? "text-white/70 justify-end"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                <svg
                                                    className="w-3 h-3 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                {formatTime(msg.ts)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {typers.length > 0 && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/20">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                            <div
                                                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: "0.1s",
                                                }}
                                            ></div>
                                            <div
                                                className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: "0.2s",
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm text-gray-300">
                                            {typers.join(", ")}{" "}
                                            {typers.length === 1 ? "is" : "are"}{" "}
                                            typing...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Premium Input Area */}
                    <div className="p-6 bg-slate-800/50 backdrop-blur-xl border-t border-white/10">
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-24 left-6 bg-white/10 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-white/20 grid grid-cols-4 gap-2 z-20">
                                {quickEmojis.map((emoji, index) => (
                                    <button
                                        key={index}
                                        onClick={() => addEmoji(emoji)}
                                        className="text-2xl hover:bg-white/20 rounded-xl p-3 transition-all hover:scale-110 transform"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end space-x-4">
                            {/* Emoji button */}
                            <button
                                onClick={() =>
                                    setShowEmojiPicker(!showEmojiPicker)
                                }
                                className="bg-white/10 backdrop-blur text-gray-300 p-4 rounded-2xl hover:bg-white/20 transition-all border border-white/20 hover:text-white"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {/* Input field */}
                            <div className="flex-1 relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message..."
                                    className="w-full resize-none rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-6 py-4 pr-16 outline-none focus:border-blue-500/50 transition-all placeholder-gray-400 text-white max-h-32 scrollbar-thin scrollbar-thumb-white/20"
                                    rows={1}
                                    style={{
                                        minHeight: "56px",
                                        height: "auto",
                                    }}
                                />
                            </div>

                            {/* Send button */}
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim()}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <svg
                                    className="w-5 h-5 relative z-10"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Clean Footer */}
                        <div className="flex items-center justify-center mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-gray-400">
                                SunoNa - Premium Chat Experience
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
