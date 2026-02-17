import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 w-content max-w-[90vw]">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`
                            flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border 
                            transition-all animate-slide-down
                            ${n.type === 'success' ? 'bg-primary/20 border-primary/30 text-primary' : ''}
                            ${n.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' : ''}
                            ${n.type === 'info' ? 'bg-secondary/20 border-secondary/30 text-secondary' : ''}
                        `}
                    >
                        <span className="material-icons-round text-xl">
                            {n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : 'info'}
                        </span>
                        <p className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                            {n.message}
                        </p>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="ml-2 hover:opacity-70 transition-all"
                        >
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
