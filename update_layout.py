import re

with open('frontend/src/components/layout/Layout.jsx', 'r') as f:
    content = f.read()

# Replace Wishlist Link
wishlist_search = r'(<Link to="/wishlist" className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition")'
wishlist_replace = r'\1\n                  aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"}'
content = re.sub(wishlist_search, wishlist_replace, content)

# Replace Cart Link
cart_search = r'(<Link to="/cart" className="relative text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition")'
cart_replace = r'\1\n                aria-label={itemsCount > 0 ? `Shopping Cart, ${itemsCount} items` : "Shopping Cart"}'
content = re.sub(cart_search, cart_replace, content)

# Replace User Menu Button
user_search = r'(<button\n                    onClick={\(\) => setUserMenuOpen\(!userMenuOpen\)}\n                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition")'
user_replace = r'\1\n                    aria-label="User Menu"\n                    aria-expanded={userMenuOpen}'
content = re.sub(user_search, user_replace, content)

# Replace Mobile Menu Button
mobile_search = r'(<button\n              onClick={\(\) => setMobileMenuOpen\(!mobileMenuOpen\)}\n              className="md:hidden text-gray-600 dark:text-gray-300")'
mobile_replace = r'\1\n              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}\n              aria-expanded={mobileMenuOpen}'
content = re.sub(mobile_search, mobile_replace, content)


with open('frontend/src/components/layout/Layout.jsx', 'w') as f:
    f.write(content)
