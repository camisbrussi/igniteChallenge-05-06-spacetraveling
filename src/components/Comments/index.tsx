import { useEffect, useRef } from 'react';

export function Comments() {
  const commentsSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');

    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      'camisbrussi/igniteChallenge-05-06-spacetraveling'
    );
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');

    commentsSection.current.appendChild(script);
  }, []);

  return <div ref={commentsSection} />;
}
