import type { Metadata } from 'next';
import QuizGame from '../tangga-wawasan/quiz-game';

export const metadata: Metadata = {
  title: 'SEJUTA POIN | TEKAD Arcade',
  description: 'Taklukkan 15 pertanyaan menuju sejuta poin bersama lima sahabat TEKAD.',
};

export default function Page(){return <QuizGame/>;}
