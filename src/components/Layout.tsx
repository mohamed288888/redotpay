import { Outlet, Link } from 'react-router-dom'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore' // تأكد من المسار الصحيح

const navigation = [
  { name: 'Home', href: '/', current: true },
  { name: 'Cards', href: '/cards', current: false },
  { name: 'Wallet', href: '/wallet', current: false },
  { name: 'Profile', href: '/profile', current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function Layout() {
  const { user, signOut } = useAuthStore() // جلب بيانات المستخدم ودالة تسجيل الخروج

  return (
    <div className="min-h-screen bg-gray-50">
      <Disclosure as="nav" className="bg-white shadow">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between items-center">
                {/* Logo */}
                <div className="flex">
                  <div className="flex flex-shrink-0 items-center">
                    <span className="text-2xl font-bold text-indigo-600">RedotPay</span>
                  </div>
                  {/* Desktop Navigation */}
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'border-indigo-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Authentication Buttons */}
                <div className="flex items-center space-x-4">
                  {user ? (
                    <>
                      <span className="text-gray-700">{user.email}</span>
                      <button
                        onClick={signOut}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/auth/signin"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/auth/signup"
                        className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-100"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      item.current
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
                {/* Mobile Authentication Buttons */}
                <div className="border-t border-gray-200 pt-4">
                  {user ? (
                    <button
                      onClick={signOut}
                      className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-100"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/auth/signin"
                        className="block px-4 py-2 text-left text-indigo-600 hover:bg-indigo-100"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/auth/signup"
                        className="block px-4 py-2 text-left text-indigo-600 hover:bg-indigo-100"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2023 RedotPay Clone. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
