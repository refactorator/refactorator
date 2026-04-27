import { userProfiles } from '../profiles/userProfiles'

export default function ProfileSelector({ activeProfile, onSelect }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {userProfiles.map((profile) => {
        const isActive = activeProfile?.id === profile.id
        return (
          <button
            key={profile.id}
            onClick={() => onSelect(profile)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all border ${
              isActive
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-700'
            }`}
          >
            {profile.name}
          </button>
        )
      })}
    </div>
  )
}
