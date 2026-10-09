import React from 'react';
import { Activity, Brain, Shield, Users } from 'lucide-react';
import MafyaRoleCard from './MafyaRoleCard';
import { FLOW_STEPS, INTRO_STEPS, MAFYA_MAX_PLAYERS, MAFYA_MIN_PLAYERS, ROLES } from './mafyaConfig';

const STEP_ICONS = { katil: Users, rol: Shield, strateji: Brain, kal: Activity };

/** Tanıtım: dört adımlı anlatım, rol kartları ve beş adımlı oyun akışı. */
export default function MafyaIntro() {
  return (
    <>
      <div className="mf-section">
        <p className="mf-section-title">NASIL OYNANIR</p>
        <span className="mf-section-line" />
      </div>
      <div className="mf-steps">
        {INTRO_STEPS.map((step) => {
          const Icon = STEP_ICONS[step.icon] || Users;
          return (
            <div className="mf-step" key={step.title}>
              <span className="mf-step-icon"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0">
                <p className="mf-step-title">{step.title}</p>
                <p className="mf-step-text">{step.text}</p>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mf-section">
        <p className="mf-section-title">ROLLER</p>
        <span className="mf-section-line" />
      </div>
      <div className="mf-roles">
        {ROLES.map((role) => <MafyaRoleCard key={role.id} role={role.id} />)}
      </div>
      <p className="mf-panel-text mt-2">
        {MAFYA_MIN_PLAYERS}-{MAFYA_MAX_PLAYERS} oyuncu oynar; roller oyuncu sayısına göre dağıtılır ve her zaman
        gizli kalır. Şehir bütün karanlık tarafı bulursa, karanlık taraf şehri yakalarsa kazanır.
      </p>

      <div className="mf-section">
        <p className="mf-section-title">OYUN AKIŞI</p>
        <span className="mf-section-line" />
      </div>
      <div className="mf-flow">
        {FLOW_STEPS.map((step) => (
          <div className="mf-flow-row" key={step.no}>
            <span className="mf-flow-no">{step.no}</span>
            <span className="min-w-0">
              <p className="mf-flow-title">{step.title}</p>
              <p className="mf-flow-text">{step.text}</p>
            </span>
          </div>
        ))}
      </div>
      <p className="mf-hero-tag mt-3 text-center">Sadece oyun değil, bir yaşam tarzı!</p>
    </>
  );
}