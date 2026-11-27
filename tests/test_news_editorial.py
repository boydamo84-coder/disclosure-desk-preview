import unittest
from scripts.news_editorial import editorial_eligible,editorial_display,editorial_rows
from scripts import refresh_dev_news, update_news_alerts
import datetime as dt

class NewsEditorialTests(unittest.TestCase):
    def row(self, title, source='NewsNation', **fields):
        return dict(headline=title,source=source,url='https://news.google.com/rss/articles/1',date='2026-11-26T12:00:00+00:00',**fields)
    def test_reject_reported_gaming_and_social(self):
        for r in [
            self.row('GTA 6 Gliding Man mystery guide: All three logbook locations, Stone Hills shed code and UFO clues','Indiatimes'),
            self.row('Grand Theft Auto VI UFO guide'),
            self.row('UFO: Disclosure | Market Data & Trends | Blockworks Intel','Blockworks'),
            self.row('👽🇺🇸 WTF! This global UFO sightings heatmap','X'),
            self.row('UAP report','YouTube'),
            self.row('UFO report','NewsBreak: Local News & Alerts'),
            self.row('UAP report','BBC',publisherUrl='https://old.reddit.com/r/UFOs/'),
            self.row('UAP report','BBC',publisherUrl='https://news.yahoo.com/story'),
            self.row('UAP report','BBC',sourceType='social-media'),
        ]:
            self.assertFalse(editorial_eligible(r),r)
    def test_known_typo_preserves_source(self):
        r=self.row('UFO encounter by former Air Force Troy Gavin on Austrailian beach')
        clean=editorial_display(r)
        self.assertEqual(clean['headline'],'UFO encounter by former Air Force Troy Gavin on Australian beach')
        self.assertEqual(clean['originalHeadline'],r['headline'])
        self.assertEqual(clean['url'],r['url'])
    def test_research_sources_retained(self):
        for r in [self.row('Pentagon releases UAP files','U.S. Department of War (.gov)'),
                  self.row('UAP records revealed by FOIA','The Black Vault'),
                  self.row('New SETI and UAP research','The Debrief'),
                  self.row('UAP analysis','Avi Loeb – Medium')]:
            self.assertTrue(editorial_eligible(r),r)
    def test_nested_and_both_collectors(self):
        good=self.row('Official UAP report','DVIDS')
        bad={**self.row('GTA 6 UFO guide'), 'relatedCoverage':[good]}
        self.assertEqual(list(editorial_rows([bad])),[good])
        self.assertEqual(refresh_dev_news.prepare_news_items([bad],now=dt.datetime(2026,11,27,tzinfo=dt.timezone.utc)),[good])
        self.assertEqual(update_news_alerts.consolidate([bad]),[good])

if __name__=='__main__':unittest.main()
