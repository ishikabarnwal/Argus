import Hero from '../components/hero/Hero'
import Differentiators from '../components/sections/Differentiators'
import Pipeline from '../components/sections/Pipeline'
import CasePreview from '../components/sections/CasePreview'
import EvidenceTypes from '../components/sections/EvidenceTypes'
import CtaBand from '../components/sections/CtaBand'

/** The marketing page. Previously the whole of App.jsx, before there were
 *  routes for it to share the layout with.
 *
 *  Order is the argument the page makes, in four moves:
 *
 *    EvidenceTypes   what do I even give it?      (glass, straight after the hero)
 *    Differentiators why this and not a folder?
 *    Pipeline        how does it work?
 *    CasePreview     what does it look like?
 *
 *  EvidenceTypes used to sit fourth, after the preview. A visitor cannot
 *  judge any of the middle three without first knowing what goes in, and the
 *  answer — three file types — is both the easiest thing on the page to grasp
 *  and the one that decides whether they have anything to upload at all.
 *
 *  Pipeline sits between the claim and the picture for the same reason: it
 *  answers the question the differentiators raise at the point it gets asked,
 *  and it breaks up what was otherwise card grid after card grid. */
export default function Home() {
  return (
    <>
      <Hero />
      <EvidenceTypes />
      <Differentiators />
      <Pipeline />
      <CasePreview />
      <CtaBand />
    </>
  )
}
