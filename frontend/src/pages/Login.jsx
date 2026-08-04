import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import './Login.css'

/**
 * Sign in and create account, one form with two modes.
 *
 * The role choice on signup is a prototype shortcut: real investigator
 * accounts would be issued, not self-selected. It is exposed here because
 * there is no admin surface to issue them from, and the reviewer needs a way
 * to see the investigator view at all.
 */

const ROLES = [
  {
    id: 'user',
    label: 'I was targeted',
    hint: 'Build a case from your own evidence',
  },
  {
    id: 'investigator',
    label: 'I review cases',
    hint: 'Read-only access across all cases',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useAuth()
  const fieldId = useId()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const account = isSignup
        ? await signUp({ email, password, role })
        : await signIn({ email, password })

      // Back to whatever they were trying to reach, or somewhere useful for
      // the role they turned out to have.
      const intended = location.state?.from?.pathname
      navigate(intended ?? (account.role === 'investigator' ? '/cases' : '/start'), {
        replace: true,
      })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function switchTo(next) {
    setMode(next)
    setError(null)
  }

  return (
    <section className="page">
      <div className="page__inner login">
        <header className="page__head">
          <p className="eyebrow label-caps">{isSignup ? 'Create account' : 'Welcome back'}</p>
          <h1 className="section__title">
            {isSignup ? 'Start your case file.' : 'Sign in to Argus.'}
          </h1>
          <p className="section__lede lead">
            {isSignup
              ? 'Cases are private to the account that creates them.'
              : 'Your cases are waiting where you left them.'}
          </p>
        </header>

        <form className="card login__form" onSubmit={handleSubmit} noValidate>
          <div className="segmented login__modes" role="group" aria-label="Sign in or create an account">
            <button
              className={`segmented__btn${!isSignup ? ' segmented__btn--on' : ''}`}
              type="button"
              onClick={() => switchTo('signin')}
            >
              Sign in
            </button>
            <button
              className={`segmented__btn${isSignup ? ' segmented__btn--on' : ''}`}
              type="button"
              onClick={() => switchTo('signup')}
            >
              Create account
            </button>
          </div>

          <div className="login__field">
            <label className="login__label label-caps" htmlFor={`${fieldId}-email`}>
              Email
            </label>
            <input
              className="input"
              id={`${fieldId}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login__field">
            <label className="login__label label-caps" htmlFor={`${fieldId}-password`}>
              Password
            </label>
            <input
              className="input"
              id={`${fieldId}-password`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />
            {isSignup && <p className="login__note text-caption">At least 8 characters.</p>}
          </div>

          {isSignup && (
            <fieldset className="login__field login__roles">
              <legend className="login__label label-caps">Account type</legend>
              <div className="login__rolegrid">
                {ROLES.map((option) => (
                  <label
                    className={`typecard${role === option.id ? ' typecard--on' : ''}`}
                    key={option.id}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="role"
                      value={option.id}
                      checked={role === option.id}
                      onChange={() => setRole(option.id)}
                    />
                    <span className="typecard__label">{option.label}</span>
                    <span className="typecard__hint">{option.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Caution orange. Red is reserved for confirmed fraud signals, and
              a rejected password is not one. */}
          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Working…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}
