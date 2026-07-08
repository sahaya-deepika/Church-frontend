import React from 'react'
import PriestLoginForm from './_components/PriestLoginForm'

const PriestLoginPage = () => {
  return (
    <div className="w-full max-w-md">
      {/* Heading */}
      <div className="mb-10">
        <p className="text-[#C9A84C] uppercase text-[10px] tracking-[0.35em] font-sans mb-2">Priest Portal</p>
        <h1 className="text-[#0F2A4A] font-serif text-3xl font-bold">Welcome Back</h1>
        <p className="text-[#0F2A4A]/50 font-sans text-sm mt-2">Sign in to manage your availability and parish services.</p>
      </div>
      <PriestLoginForm />
    </div>
  )
}

export default PriestLoginPage;