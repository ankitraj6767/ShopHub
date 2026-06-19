import re

with open('frontend/src/components/layout/Layout.jsx', 'r') as f:
    content = f.read()

# Add focus styles to links/buttons
wishlist_class_search = r'className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"\n                  aria-label'
wishlist_class_replace = r'className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"\n                  aria-label'
content = re.sub(wishlist_class_search, wishlist_class_replace, content)

cart_class_search = r'className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"\n                aria-label'
cart_class_replace = r'className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"\n                aria-label'
content = re.sub(cart_class_search, cart_class_replace, content)

user_class_search = r'className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"\n                    aria-label'
user_class_replace = r'className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"\n                    aria-label'
content = re.sub(user_class_search, user_class_replace, content)

mobile_class_search = r'className="md:hidden text-gray-600 dark:text-gray-300"\n              aria-label'
mobile_class_replace = r'className="md:hidden text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"\n              aria-label'
content = re.sub(mobile_class_search, mobile_class_replace, content)


with open('frontend/src/components/layout/Layout.jsx', 'w') as f:
    f.write(content)
