import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AdminNav } from '../../admin/components/AdminNav'
import type { Player, PlayerInput } from '../api/playerApi'
import { usePlayers } from '../hooks/usePlayers'

type PlayerForm = PlayerInput

export function PlayersPage() {
  const players = usePlayers()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const playerForm = useForm<PlayerForm>({ defaultValues: { first_name: '', last_name: '', email: '', phone: '', role: 'PLAYER' } })

  useEffect(() => {
    if (selectedPlayer) playerForm.reset({ ...selectedPlayer, phone: selectedPlayer.phone ?? '' })
  }, [playerForm, selectedPlayer])

  async function savePlayer(values: PlayerForm) {
    const input = { ...values, first_name: values.first_name.trim(), last_name: values.last_name.trim(), email: values.email.trim() }
    if (selectedPlayer) {
      await players.update.mutateAsync({ id: selectedPlayer.id, input })
    } else {
      await players.create.mutateAsync(input)
      playerForm.reset()
    }
  }

  const requestError = players.error || players.create.error || players.update.error || players.deactivate.error

  return (
    <section>
      <AdminNav />
      <h1 className="text-3xl font-semibold">Joueurs</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <table className="w-full text-left text-sm"><thead><tr className="border-b border-stone-300"><th className="py-2">Joueur</th><th>Rôle</th><th>Statut</th><th /></tr></thead><tbody>{players.data?.map((player) => <tr className="border-b border-stone-200" key={player.id}><td className="py-3"><button className="font-medium text-teal-800" onClick={() => setSelectedPlayer(player)} type="button">{player.first_name} {player.last_name}</button><span className="block text-stone-500">{player.email}</span></td><td>{player.role}</td><td>{player.active ? 'Actif' : 'Inactif'}</td><td className="flex gap-3 py-3"><Link className="text-teal-800" to={`/admin/players/${player.id}/disciplines`}>Gérer les disciplines</Link>{player.active ? <button className="text-red-700" onClick={() => players.deactivate.mutate(player.id)} type="button">Désactiver</button> : null}</td></tr>)}</tbody></table>
          {players.isLoading ? <p className="mt-4 text-sm text-stone-600">Chargement...</p> : null}
        </div>
        <div className="border-l border-stone-200 pl-0 lg:pl-8">
          <h2 className="text-xl font-semibold">{selectedPlayer ? 'Modifier le joueur' : 'Créer un joueur'}</h2>
          <form className="mt-4 grid gap-3" onSubmit={playerForm.handleSubmit(savePlayer)}>
            <input className="border border-stone-300 bg-white px-3 py-2" placeholder="Prénom" required {...playerForm.register('first_name', { required: true })} />
            <input className="border border-stone-300 bg-white px-3 py-2" placeholder="Nom" required {...playerForm.register('last_name', { required: true })} />
            <input className="border border-stone-300 bg-white px-3 py-2" placeholder="E-mail" required type="email" {...playerForm.register('email', { required: true })} />
            <input className="border border-stone-300 bg-white px-3 py-2" placeholder="Téléphone facultatif" {...playerForm.register('phone')} />
            <select className="border border-stone-300 bg-white px-3 py-2" {...playerForm.register('role')}><option value="PLAYER">Joueur</option><option value="ADMIN">Administrateur</option></select>
            <div className="flex gap-3"><button className="bg-teal-800 px-4 py-2 text-sm font-semibold text-white" disabled={players.create.isPending || players.update.isPending} type="submit">{selectedPlayer ? 'Enregistrer' : 'Créer'}</button>{selectedPlayer ? <button className="text-sm text-stone-600" onClick={() => { setSelectedPlayer(null); playerForm.reset() }} type="button">Nouveau joueur</button> : null}</div>
          </form>
        </div>
      </div>
      {requestError ? <p className="mt-5 text-sm text-red-700" role="alert">{requestError.message}</p> : null}
    </section>
  )
}