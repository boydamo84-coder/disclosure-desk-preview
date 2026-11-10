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

 def test_event_group_merges_pilot_coverage_but_keeps_each_publisher_link(self):
  rows=[
   {'headline':'Trump says Air Force pilots saw a strange UFO by their F-22','url':'https://example.org/1','source':'Publisher 1','id':'one','date':'2026-11-10T04:00:00+00:00'},
   {'headline':'Trump shares very strange revelations from Air Force pilots about UFOs','url':'https://example.org/2','source':'Publisher 2','id':'two','date':'2026-11-09T10:00:00+00:00'},
   {'headline':'Pentagon publishes separate declassified UFO files','url':'https://example.org/3','source':'Publisher 3','id':'three','date':'2026-11-09T09:00:00+00:00'}
  ]
  grouped=mod.group_event_coverage(rows)
  self.assertEqual(len(grouped),2)
  self.assertEqual(grouped[0]['id'],'one')
  self.assertEqual(grouped[0]['relatedCoverage'][0]['url'],rows[1]['url'])
  self.assertEqual(grouped[0]['relatedCoverage'][0]['source'],'Publisher 2')
 def test_group_keeps_distinct_official_file_and_batch_identifiers(self):
  base='2026-11-10T04:00:00+00:00'
  entries=[
   {'headline':'Video - DOW-UAP-PR124, Unresolved UAP Report, Pacific Ocean, 2019','url':'https://example.org/pr124','date':base},
   {'headline':'Video - DOW-UAP-PR125, Unresolved UAP Report, Pacific Ocean, 2019','url':'https://example.org/pr125','date':base},
   {'headline':'Department of War Publishes Fourth Release of UAP Files','url':'https://example.org/fourth','date':base},
   {'headline':'Department of War Publishes Second Release of UAP Files','url':'https://example.org/second','date':base}
  ]
  grouped=mod.group_event_coverage(entries)
  self.assertEqual(len(grouped),4,'distinct case IDs and numbered batches are not duplicate news')
 def test_group_retains_original_alternates_across_refresh(self):
  first={'headline':'Trump says pilots saw very strange UFO encounters','url':'https://example.org/1',
         'source':'Primary','date':'2026-11-10T04:00:00+00:00',
         'relatedCoverage':[{'headline':'Trump says Air Force pilots told him very strange things about UFOs',
                            'url':'https://example.org/2','source':'Alternate','id':'b','date':'2026-11-10T03:00:00+00:00'}]}
  once=mod.group_event_coverage([first])
  twice=mod.group_event_coverage(once)
  self.assertEqual(len(twice),1)
  self.assertEqual(len(twice[0]['relatedCoverage']),1)
  self.assertEqual(twice[0]['relatedCoverage'][0]['id'],'b')
 def test_distinct_pilot_investigation_without_trump_is_kept(self):
  rows=[
   {'headline':'Trump says Air Force pilots saw a strange UFO','url':'https://example.org/a','date':'2026-11-10T03:00:00+00:00'},
   {'headline':'Commercial airline pilots record UFO over Ohio','url':'https://example.org/b','date':'2026-11-10T03:00:00+00:00'}]
  self.assertEqual(len(mod.group_event_coverage(rows)),2)
if __name__=='__main__':unittest.main()
