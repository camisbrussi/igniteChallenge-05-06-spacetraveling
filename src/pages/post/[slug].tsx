import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { Comments } from '../../components/Comments';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface Navigation {
  prevPost: {
    uid: string;
    data: {
      title: string;
    };
  }[];
  nextPost: {
    uid: string;
    data: {
      title: string;
    };
  }[];
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: Navigation;
}

export default function Post({ post, preview, navigation }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }

  const totalWords = post.data.content.reduce((total, content) => {
    total += content.heading;
    total += RichText.asText(content.body);

    return total;
  }, '');

  const readAverage = Math.ceil(totalWords.split(' ').length / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.post}>
          <img src={post.data.banner.url} alt="banner" />
          <h1>{post.data.title}</h1>

          <div className={styles.data}>
            <FiCalendar size={20} />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM u', {
                locale: ptBR,
              })}
            </time>
            <FiUser size={20} />
            <span>{post.data.author}</span>
            <FiClock size={20} />
            <span>{readAverage} min</span>
          </div>
          <div className={styles.edit}>
            <span>*editado em </span>
            <time>
              {format(
                new Date(post.last_publication_date),
                "dd MMM u', ás 'hh:mm",
                {
                  locale: ptBR,
                }
              )}
            </time>
          </div>

          {post.data.content.map(content => (
            <article key={content.heading}>
              <strong>{content.heading}</strong>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>

        <section className={styles.navigation}>
          {navigation?.prevPost.length > 0 && (
            <div>
              <p>{navigation.prevPost[0].data.title}</p>
              <Link href={`/post/${navigation.prevPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {navigation?.nextPost.length > 0 && (
            <div>
              <p>{navigation.nextPost[0].data.title}</p>
              <Link href={`/post/${navigation.nextPost[0].uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          )}
        </section>

        <Comments />
        {preview && (
          <Link href="/api/exit-preview">
            <a className={commonStyles.preview}>Sair do modo Preview</a>
          </Link>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  console.log(response.last_publication_date);

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
    revalidate: 60 * 60, // 1 hour,
  };
};
