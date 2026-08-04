import Hero from '../components/hero/Hero'
import Differentiators from '../components/sections/Differentiators'
import CasePreview from '../components/sections/CasePreview'
import EvidenceTypes from '../components/sections/EvidenceTypes'
import CtaBand from '../components/sections/CtaBand'

/** The marketing page. Previously the whole of App.jsx, before there were
 *  routes for it to share the layout with. */
export default function Home() {
  return (
    <>
      <Hero />
      <Differentiators />
      <CasePreview />
      <EvidenceTypes />
      <CtaBand />
    </>
  )
}
