import Hero from '../components/hero/Hero'
import Differentiators from '../components/sections/Differentiators'
import Pipeline from '../components/sections/Pipeline'
import CasePreview from '../components/sections/CasePreview'
import EvidenceTypes from '../components/sections/EvidenceTypes'
import CtaBand from '../components/sections/CtaBand'

/** The marketing page. Previously the whole of App.jsx, before there were
 *  routes for it to share the layout with.
 *
 *  Pipeline sits third deliberately. Without it the page is three card grids
 *  in a row — differentiators, then the preview's stat list, then evidence
 *  types — and the eye stops reading them separately. It also answers the
 *  question the differentiators raise ("how?") at the point it gets asked,
 *  before the preview shows what comes out the other end. */
export default function Home() {
  return (
    <>
      <Hero />
      <Differentiators />
      <Pipeline />
      <CasePreview />
      <EvidenceTypes />
      <CtaBand />
    </>
  )
}
