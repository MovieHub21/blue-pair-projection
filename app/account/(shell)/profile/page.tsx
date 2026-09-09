'use client'
export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="card p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-lg">AO</div>
          <div><b className="block">Adaeze Okonkwo</b><span className="pill-gold">VIP member</span></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Full name</label><input className="field-input" defaultValue="Adaeze Okonkwo" /></div>
          <div><label className="field-label">Phone</label><input className="field-input" defaultValue="+234 803 214 5567" /></div>
          <div><label className="field-label">Email</label><input className="field-input" defaultValue="adaeze.okonkwo@gmail.com" /></div>
          <div><label className="field-label">Country</label><input className="field-input" defaultValue="Nigeria" /></div>
        </div>
        <button className="btn-outline mt-6">Save changes</button>
      </div>
    </div>
  )
}
