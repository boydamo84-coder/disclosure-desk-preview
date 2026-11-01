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
if __name__=='__main__':unittest.main()
