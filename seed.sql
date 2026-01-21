-- Default Admin User (username: admin, password: admin123)
-- Password hash is SHA-256 of 'admin123'
INSERT OR REPLACE INTO admin_users (id, username, password_hash) VALUES 
  (1, 'admin', '240be518fabd2724ddb6f04eeb9d5b074f1c58aecddcd3a50f93c3e9c5f5f2d4');

-- Site Settings
INSERT OR REPLACE INTO site_settings (setting_key, setting_value, setting_type) VALUES 
  ('site_name', 'Drishti Digital Library', 'text'),
  ('site_tagline', 'Self Study Center', 'text'),
  ('logo_text', 'DRISHTI', 'text'),
  ('logo_highlight', 'LIBRARY', 'text'),
  ('phone_number', '+91 98765 43210', 'text'),
  ('whatsapp_number', '919876543210', 'text'),
  ('address', 'Main Road, Near Bus Stand, Your City - 123456', 'text'),
  ('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m13!1d58842.16434850721!2d86.1558223405761!3d22.815918731175654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f5e31989f0e2b3%3A0x4560124953c80051!2sSakchi%2C%20Jamshedpur%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin', 'text'),
  ('footer_text', '© 2026 Drishti Digital Library. All Rights Reserved.', 'text'),
  ('about_text', 'Drishti Digital Library एक modern self-study center है जहाँ शांत वातावरण में पढ़ाई करें।', 'text');

-- Hero Slides
INSERT OR REPLACE INTO hero_slides (id, image_url, title, subtitle, display_order, is_active) VALUES 
  (1, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1350&q=80', 'शान्त वातावरण, बेहतर पढ़ाई', 'Drishti Digital Library में आपका स्वागत है।', 1, 1),
  (2, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1350&q=80', 'Focus on Your Success', 'आधुनिक सुविधाओं के साथ अपनी मंज़िल को पाएं।', 2, 1),
  (3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1350&q=80', 'Premium Study Environment', '24/7 AC, WiFi और CCTV सुरक्षा के साथ।', 3, 1);

-- Gallery Images
INSERT OR REPLACE INTO gallery_images (id, image_url, alt_text, display_order, is_active) VALUES 
  (1, 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=600&q=80', 'Library Reading Area', 1, 1),
  (2, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', 'Study Desks', 2, 1),
  (3, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80', 'Book Collection', 3, 1),
  (4, 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80', 'Study Hall', 4, 1);

-- Social Links
INSERT OR REPLACE INTO social_links (id, platform, url, icon_class, is_active) VALUES 
  (1, 'whatsapp', 'https://wa.me/919876543210', 'fab fa-whatsapp', 1),
  (2, 'instagram', 'https://instagram.com/drishtilibrary', 'fab fa-instagram', 1),
  (3, 'facebook', 'https://facebook.com/drishtilibrary', 'fab fa-facebook-f', 1),
  (4, 'youtube', 'https://youtube.com/@drishtilibrary', 'fab fa-youtube', 1);
