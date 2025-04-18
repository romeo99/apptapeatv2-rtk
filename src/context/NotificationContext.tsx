import { createContext, ReactNode, useContext, useState } from 'react';
export const notificationSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3';

interface NotificationContextType {
    playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);


export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notificationSound] = useState(notificationSoundUrl);

    const playNotificationSound = () => {
        //notificationSound.play();
        try {
            // Play notification sound
            const audio = new Audio(notificationSound);
            audio.volume = 1.0;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error('Error playing notification:', error);
                });
            }
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ playNotificationSound }}>
            {children}
        </NotificationContext.Provider>
    );
};

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}