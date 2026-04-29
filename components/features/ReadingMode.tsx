'use client';
import { BookOpen, Clock, Printer } from 'lucide-react';
import styles from './ReadingMode.module.css';

interface ReadingModeProps {
  url: string;
  title: string;
}

export default function ReadingMode({ url, title }: ReadingModeProps) {
  return (
    <div className={styles.readingMode}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <BookOpen size={16} style={{ color: 'var(--brand-primary)' }} />
          <span className={styles.toolbarTitle}>Reading Mode</span>
        </div>
        <div className={styles.toolbarRight}>
          <button className="btn btn-ghost" style={{ gap: 6, fontSize: 12 }}>
            <Printer size={13} /> Print
          </button>
        </div>
      </div>
      <div className={styles.reader}>
        <article className={styles.article}>
          <div className={styles.meta}>
            <span className="badge badge-primary">Article</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {url.replace(/^https?:\/\//, '').split('/')[0]}
            </span>
            <span className={styles.readTime}><Clock size={12} /> 4 min read</span>
          </div>
          <h1 className={styles.articleTitle}>{title}</h1>
          <div className={styles.articleBody}>
            <p>This is the <strong>Reading Mode</strong> view, a distraction-free, beautifully-typeset version of the webpage&apos;s main content. In a production Electron browser, this would use Mozilla&apos;s Readability library to parse and extract the article&apos;s content.</p>
            <h2>Key Features of Reading Mode</h2>
            <p>Reading mode removes advertisements, navigation bars, sidebars, and other non-content elements. It formats the remaining text with optimal typography settings for long-form reading:</p>
            <ul>
              <li>Optimal line length (65-75 characters per line)</li>
              <li>Comfortable line spacing (1.7x)</li>
              <li>Serifed or custom font for body text</li>
              <li>High contrast text on a warm background</li>
              <li>Adjustable font size and theme</li>
            </ul>
            <blockquote>
              &quot;Typography is the voice of the written word. Good typography makes reading invisible, so you focus on the ideas, not the letters.&quot;
            </blockquote>
            <h2>Customization</h2>
            <p>You can adjust the font size, column width, background color, and font family. Your preferences are saved per-domain so each site remembers your settings.</p>
            <p>Reading mode also supports text-to-speech, annotations, and highlights. Anything you highlight gets saved to your Reading List for later reference.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
