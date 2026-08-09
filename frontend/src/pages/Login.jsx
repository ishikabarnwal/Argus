import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import './Login.css'

/**
 * Sign in and create account, one form with two modes.
 *
 * Signup has no account-type choice — an investigator reads every case in the
 * system, and that is not the asker's decision to make. What it has instead
 * is an optional invite code, which the deployment's administrator sets and
 * gives out privately.
 *
 * A wrong code raises nothing. It quietly produces an ordinary account,
 * because a form that says "that code is wrong" is a free oracle for guessing
 * at it — see backend/lib/inviteCode.js. Someone who was given a real code
 * will land on the case list; someone guessing learns only that they did not.
 *
 * Signing *in* is unchanged.
 */

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useAuth()
  const fieldId = useId()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const account = isSignup
        ? await signUp({ email, password, inviteCode })
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

          {/* Optional, and last, because almost nobody filling this form has
              one. Mono because it is a code to be transcribed exactly, and
              autoComplete off so a browser never offers to remember it. */}
          {isSignup && (
            <div className="login__field">
              <label className="login__label label-caps" htmlFor={`${fieldId}-invite`}>
                Investigator invite code <span className="login__optional">(optional)</span>
              </label>
              <input
                className="input input--mono"
                id={`${fieldId}-invite`}
                type="text"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
              <p className="login__note text-caption">
                Leave this blank unless you were given a code. Investigators can read every
                case on the system; everyone else gets an account that can only see their own.
              </p>
            </div>
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
