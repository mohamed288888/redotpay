import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'

type FormData = {
  email: string
  password: string
}

type AuthFormProps = {
  mode: 'signin' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()
  const { signIn, signUp } = useAuthStore()

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === 'signin') {
        await signIn(data.email, data.password)
      } else {
        await signUp(data.email, data.password)
      }
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </div>
    </form>
  )
}