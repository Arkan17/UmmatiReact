// Rotating daily reminder for the community header: one per day of the year.

export interface Reminder { text: string; source: string }

export const REMINDERS: Reminder[] = [
  { text: 'The best among you are those who learn the Quran and teach it.', source: 'Sahih al-Bukhari 5027' },
  { text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', source: 'Sahih al-Bukhari 6018' },
  { text: 'None of you truly believes until he loves for his brother what he loves for himself.', source: 'Sahih al-Bukhari 13' },
  { text: 'Smiling in the face of your brother is charity.', source: 'Jami at-Tirmidhi 1956' },
  { text: 'The most beloved deeds to Allah are those done regularly, even if they are small.', source: 'Sahih al-Bukhari 6464' },
  { text: 'Verily, with hardship comes ease.', source: 'Quran 94:6' },
  { text: 'So remember Me; I will remember you.', source: 'Quran 2:152' },
  { text: 'Allah does not burden a soul beyond what it can bear.', source: 'Quran 2:286' },
  { text: 'The strong person is not the one who wrestles others, but the one who controls himself when angry.', source: 'Sahih al-Bukhari 6114' },
  { text: 'Make things easy and do not make them difficult; give glad tidings and do not drive people away.', source: 'Sahih al-Bukhari 69' },
  { text: 'And He is with you wherever you are.', source: 'Quran 57:4' },
  { text: 'Charity does not decrease wealth.', source: 'Sahih Muslim 2588' },
  { text: 'Whoever relieves a believer of a hardship, Allah will relieve him of a hardship on the Day of Resurrection.', source: 'Sahih Muslim 2699' },
  { text: 'Indeed, in the remembrance of Allah do hearts find rest.', source: 'Quran 13:28' },
  { text: 'The dua of a Muslim for his brother in his absence is answered.', source: 'Sahih Muslim 2733' },
  { text: 'Take advantage of five before five: your youth before old age, health before sickness, wealth before poverty, free time before busyness, and life before death.', source: 'Al-Hakim, Sahih' },
  { text: 'And speak to people good words.', source: 'Quran 2:83' },
  { text: 'Purity is half of faith.', source: 'Sahih Muslim 223' },
  { text: 'Call upon Me; I will respond to you.', source: 'Quran 40:60' },
  { text: 'A good word is charity.', source: 'Sahih al-Bukhari 2989' },
  { text: 'Do not belittle any good deed, even meeting your brother with a cheerful face.', source: 'Sahih Muslim 2626' },
  { text: 'Indeed, Allah is with the patient.', source: 'Quran 2:153' },
  { text: 'The believers are but brothers, so make peace between your brothers.', source: 'Quran 49:10' },
  { text: 'Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise.', source: 'Sahih Muslim 2699' },
  { text: 'Avoid suspicion, for suspicion is the most false of speech.', source: 'Sahih al-Bukhari 6066' },
  { text: 'My mercy encompasses all things.', source: 'Quran 7:156' },
  { text: 'The most complete of believers in faith are those with the best character.', source: 'Sunan Abi Dawud 4682' },
  { text: 'And whoever puts his trust in Allah, He will be enough for him.', source: 'Quran 65:3' },
  { text: 'Read the Quran, for it will come on the Day of Resurrection as an intercessor for its companions.', source: 'Sahih Muslim 804' },
  { text: 'Be in this world as if you were a stranger or a traveller.', source: 'Sahih al-Bukhari 6416' },
];

export function todaysReminder(date = new Date()): Reminder {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return REMINDERS[day % REMINDERS.length];
}
