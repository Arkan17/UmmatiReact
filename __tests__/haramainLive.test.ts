import {
  HARAMAIN_STREAMS,
  HaramainHeroCards,
  HaramainLiveSection,
  getMakkahTime,
  type HaramainStream,
} from '../src/features/home/components/HaramainLiveSection';

describe('Haramain Live 24/7 Streams', () => {
  it('contains verified live streams for both Makkah and Madinah', () => {
    expect(HARAMAIN_STREAMS.length).toBeGreaterThanOrEqual(2);
    const ids = HARAMAIN_STREAMS.map(s => s.id);
    expect(ids).toContain('makkah');
    expect(ids).toContain('madinah');
  });

  it('configures Saudi Quran TV for Makkah Live with correct channel ID and verified video ID', () => {
    const makkah = HARAMAIN_STREAMS.find(s => s.id === 'makkah');
    expect(makkah).toBeDefined();
    expect(makkah?.channelId).toBe('UCos52azQNBgW63_9uDJoPDA');
    expect(makkah?.embedUrl).toContain('youtube-nocookie.com/embed/live_stream');
    expect(makkah?.embedUrl).toContain('UCos52azQNBgW63_9uDJoPDA');
    expect(makkah?.videoId).toBe('eC4LfEVxvKg');
    expect(makkah?.watchUrl).toContain('youtube.com/watch?v=eC4LfEVxvKg');
  });

  it('configures Saudi Sunnah TV for Madinah Live with correct channel ID and verified video ID', () => {
    const madinah = HARAMAIN_STREAMS.find(s => s.id === 'madinah');
    expect(madinah).toBeDefined();
    expect(madinah?.channelId).toBe('UCROKYPep-UuODNwyipe6JMw');
    expect(madinah?.embedUrl).toContain('youtube-nocookie.com/embed/live_stream');
    expect(madinah?.embedUrl).toContain('UCROKYPep-UuODNwyipe6JMw');
    expect(madinah?.videoId).toBe('Rs7St51oDDc');
    expect(madinah?.watchUrl).toContain('youtube.com/watch?v=Rs7St51oDDc');
  });

  it('verifies all stream definitions include required metadata', () => {
    HARAMAIN_STREAMS.forEach((stream: HaramainStream) => {
      expect(stream.id).toBeTruthy();
      expect(stream.title).toBeTruthy();
      expect(stream.arabicName).toBeTruthy();
      expect(stream.location).toBeTruthy();
      expect(stream.badge).toBeTruthy();
      expect(stream.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(stream.virtueText).toBeTruthy();
      expect(stream.reference).toBeTruthy();
      expect(stream.videoId).toBeTruthy();
      expect(stream.watchUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    });
  });

  it('exports HaramainHeroCards and backward-compatible HaramainLiveSection', () => {
    expect(HaramainHeroCards).toBeDefined();
    expect(HaramainLiveSection).toBeDefined();
  });

  it('formats Makkah AST local time string', () => {
    const time = getMakkahTime();
    expect(typeof time).toBe('string');
  });
});
