import unittest
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('refresh_dev_news',Path('scripts/refresh_dev_news.py'))
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
class NewsRelevanceTests(unittest.TestCase):
 def test_rejects_corporate_solar_headline(self):
  self.assertFalse(mod.relevant_headline('Anker SOLIX Unveils Dual-Cycle Home Battery And Balcony Solar Range at All Energy Australia'))
 def test_rejects_sustainability(self):
  self.assertFalse(mod.relevant_headline('Australian Steel Industry Sustainability Certification Scheme Wins Global Award'))
 def test_accepts_uap_report(self):
  self.assertTrue(mod.relevant_headline('Australian pilots report UFO sighting near Melbourne'))
 def test_country_required(self):
  self.assertFalse(mod.applies_to_country('Pentagon publishes UFO report','Australia'))
  self.assertTrue(mod.applies_to_country('Australian pilots report UFO sighting','Australia'))
 def test_rejects_unrelated_headline(self):
  self.assertFalse(mod.relevant_headline('Solar company announces new power stations'))
 def test_same_headline_on_distinct_google_links_collapses(self):
  rows=[
   {'headline':'Navy admiral warns of UAP cover-up','source':'Publisher A','url':'https://news.google.com/rss/articles/A','date':'2026-11-10T04:00:00+00:00','id':'A'},
   {'headline':'Navy admiral warns of UAP “cover-up”','source':'Publisher B','url':'https://news.google.com/rss/articles/B','date':'2026-11-10T04:00:00+00:00','id':'B'},
   {'headline':'Navy admiral warns of new UAP cover-up','source':'Publisher C','url':'https://example.org/C','date':'2026-11-10T04:00:00+00:00','id':'C'}
  ]
  retained=mod.deduplicate_headlines(rows)
  self.assertEqual([r['id'] for r in retained],['A','C'])
  self.assertEqual(retained[0]['url'],rows[0]['url'])
 def test_same_title_weeks_later_kept(self):
  rows=[
   {'headline':'UFO investigation updates','url':'https://example.org/new','date':'2026-11-10T04:00:00+00:00'},
   {'headline':'UFO investigation updates','url':'https://example.org/old','date':'2026-10-01T04:00:00+00:00'}
  ]
  self.assertEqual(len(mod.deduplicate_headlines(rows)),2)
 def test_normalized_headline_keeps_unicode_letters(self):
  self.assertEqual(mod.normalized_headline('UAP – GEIPAN déjà-vu!'),mod.normalized_headline('uap geipan deja vu'))

if __name__=='__main__':unittest.main()
