import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useProfile } from '../hooks/useProfile'

type ProfileFormValues = {
  firstName: string
  lastName: string
  phone: string
}

export function ProfilePage() {
  const { data: profile, error, isLoading, isSuccess, isUpdating, updateError, updateProfile } = useProfile()
  const { register, handleSubmit, reset } = useForm<ProfileFormValues>({
    defaultValues: { firstName: '', lastName: '', phone: '' },
  })

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone ?? '',
      })
    }
  }, [profile, reset])

  if (isLoading) {
    return <p className="text-sm text-stone-600">Chargement du profil...</p>
  }

  if (error || !profile) {
    return <p className="text-sm text-red-700" role="alert">{error?.message ?? 'Profil introuvable.'}</p>
  }

  const notificationPreferences = profile.notification_preferences

  async function onSubmit(values: ProfileFormValues) {
    await updateProfile({
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      notification_preferences: notificationPreferences,
    })
  }

  return (
    <section className="max-w-xl">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Mon compte</p>
      <h1 className="mt-2 text-3xl font-semibold">Mon profil</h1>
      <p className="mt-3 text-stone-600">{profile.email}</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium text-stone-700">
          Prénom
          <input
            className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-700"
            {...register('firstName', { required: 'Le prénom est requis.' })}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Nom
          <input
            className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-700"
            {...register('lastName', { required: 'Le nom est requis.' })}
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Téléphone
          <input
            autoComplete="tel"
            className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-700"
            {...register('phone')}
          />
        </label>

        {updateError ? <p className="text-sm text-red-700" role="alert">{updateError.message}</p> : null}
        {isSuccess ? <p className="text-sm text-teal-800" role="status">Profil mis à jour.</p> : null}

        <button
          className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUpdating}
          type="submit"
        >
          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </section>
  )
}