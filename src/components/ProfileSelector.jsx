import { userProfiles } from '../profiles/userProfiles'

export default function ProfileSelector({ activeProfile, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {userProfiles.map((profile) => {
        const isActive = activeProfile?.id === profile.id
        return (
          <button
            key={profile.id}
            onClick={() => onSelect(profile)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white text-zinc-900 border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            <span>{profile.emoji}</span>
            <span>{profile.name}</span>
          </button>
        )
      })}
    </div>
  )
}
