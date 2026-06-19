import re

with open('frontend/src/components/ui/NotificationCenter.jsx', 'r') as f:
    content = f.read()

# Replace Bell Button
bell_search = r'(<button\n        onClick={\(\) => {\n          setIsOpen\(!isOpen\);\n          if \(!isOpen\) {\n            lastFetchRef.current = 0;\n            fetchNotifications\(\);\n          }\n        }}\n        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition")'
bell_replace = r'\1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"\n        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}\n        aria-expanded={isOpen}'

content = re.sub(bell_search, bell_replace, content)

with open('frontend/src/components/ui/NotificationCenter.jsx', 'w') as f:
    f.write(content)
