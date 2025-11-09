import React, { useEffect } from "react";

type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  // Effect to automatically close the notification after the specified duration
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [onClose, duration]);

  // Tailwind CSS classes for different notification types
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white"; // Green
      case "error":
        return "bg-red-500 text-white"; // Red
      case "info":
        return "bg-blue-500 text-white"; // Blue
      default:
        return "";
    }
  };

  // Define icons based on the notification type

  return (
    <div
      className={`flex justify-between items-center max-w-md mx-auto p-4 rounded-lg shadow-md transition-opacity duration-300 opacity-100 ${getNotificationStyle(
        type,
      )}`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xl"></span>
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-white font-bold text-lg bg-transparent border-0 cursor-pointer"
      >
        X
      </button>
    </div>
  );
};

export default Notification;
