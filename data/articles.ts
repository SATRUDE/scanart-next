export interface Article {
  id: string;
  title: string;
  slug: string; // URL-friendly version of the title
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  featured?: boolean; // Whether this article should be featured
  featuredProducts?: string[]; // Array of product IDs to show in "Discover Our Prints" section
}

// Utility function to generate slugs from titles
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

export const articles: Article[] = [
  {
    id: '1',
    title: 'Who are Scandinavian Art?',
    slug: 'who-are-scandinavian-art?',
    excerpt: 'Scandinavian Art offers art enthusiasts the chance to enhance their homes with the distinct Scandinavian aesthetic.',
    category: 'About',
    featured: true, // This article will be featured
    featuredProducts: ['1', '2', '3'], // Dragon, Mean Snothing, Half Man
        content: `
      <h3>Our vision</h3>
      <p>Scandinavian Art offers art enthusiasts the chance to enhance their homes with the distinct Scandinavian aesthetic while also providing a unique opportunity for Scandinavian artists and expand their audience.</p>
      
      <h3>Core Principles</h3>
      <p>At its core, Scandinavian design celebrates natural materials, clean lines, and the concept of "lagom"—having just the right amount. This approach creates spaces that feel both serene and purposeful, where every element serves a function while contributing to the overall aesthetic harmony.</p>
      
      <h3>Where it started</h3>
      <p>The inspiration for Scandinavian Art came from a conversation with a friend, an artist residing in Oslo. We realised there was a gap in the market for Scandinavian art works in the rest of the world. This sparked the idea of creating a platform where these talented artists could showcase their work to a broader audience.</p>
      
      <h3>Exporting the Scandinavian lifestyle</h3>
      <p>We work closely with local artists, leveraging their expertise to select the best and most authentic pieces. This direct connection ensures that our collection is always fresh, diverse, and of the highest quality. For our customers, this means access to unique and exclusive artworks that you won't find anywhere else. Our prints are produced using premium materials and state-of-the-art printing techniques, ensuring vibrant colours and lasting durability. By choosing Scandinavian Art, you are not only enhancing your space with beautiful and meaningful pieces but choosing to put a piece of Scandinavia in your home.</p>
      
      <h3>Showcasing the Best of Scandinavia's Artists</h3>
<p>For Scandinavian artists, our platform offers an invaluable opportunity to reach new audiences and expand their creative horizons. By showcasing their work to a broader market, they can gain the recognition and appreciation they deserve. This exposure not only helps them grow their careers but also encourages the continued evolution and diversification of Scandinavian art.We are committed to supporting these artists by providing a fair and transparent platform where their work can shine. Every purchase made through Scandinavian Art directly supports the artists, allowing them to continue creating and sharing their incredible talents with the world.</p>    `,
    featuredImage: '/images/journal/mac.png'
  },
  {
    id: '2',
    title: 'An interview by Nordic Notes',
    slug: 'nature-as-muse-the-botanical-art-renaissance',
    excerpt: 'How contemporary artists are reimagining botanical illustration for modern spaces.',
    category: 'About',
    featuredProducts: ['4', '5', '6'], // Eye Nose Eye, Morgenstrekk, Slingshot
    content: `
    <h3>This interview was conducted by Nicola by Nordic Notes.</h3>
<p>Nordic Notes is a brilliant website where readers can be inspired with Nordic style. I highly recommend all to take a look and lose yourself in the articles.</p>
<p>To find the original article, read it here: <a href="https://nordicnotes.co.uk/my-chat-with-scandinavian-art/">https://nordicnotes.co.uk/my-chat-with-scandinavian-art/</a></p>

<h3>Scandinavian Art – My chat with founder Mark Diffey</h3>
<p>Nothing makes a house feel like a home more than when it reflects the people living there. And while we all have a favourite cup to drink from, or cushion on the sofa, it’s through the art we hang on our walls that we can create a space that is as unique as we are.</p>
<p>Offering a carefully considered collection of contemporary artworks, from established and as well as upcoming artists, new online print store Scandinavian Art gives us all the opportunity to tell our own story.</p>
<p>Whether you’re looking for bright botanicals, bold geometrics or colourful motifs, you won’t find their prints anywhere else, and with each one meticulously produced using state-of-the-art techniques on premium paper you are ensured vibrant colours and lasting quality too.</p>
<p>Based in Oslo, but originally from the UK, I recently chatted to the founder of Scandinavian Art, Mark Diffey to find out more:</p>

<h3>Shall we start with a little about you, what your background is, and why you’re so passionate about Scandinavian art?</h3>
<p>I was lucky enough to grow up five minutes from the beach in Bournemouth. After studying computer science and going on to work as a web designer internationally, it was finding love that brought me to Norway.</p>
<p>It was after buying my first home in Oslo that I dived into the world of interiors, and the diverse world of Scandinavian art. Packed with personalities, and as the perfect partner to a paired back sense of style, almost five years on it feels nice to be able to share a piece of Norway with the rest of the world, especially my home country.</p>

<h3>How did you turn this passion into an online print store, and what for you makes Scandinavian Art different?</h3>
<p>The idea for Scandinavian Art was born after I found there was a real gap in the online market. After speaking about how I was struggling to find high-quality prints that fitted my home with an artist friend of mine, as well as a number of local artists, I also saw there was a real appetite for them to sell internationally too.</p>
<p>For me, what makes Scandinavian Art different is that by showcasing and selling a unique selection of works by artists from this area we not only ensure everything you buy has a story to tell, but we also build a passionate community of artists and patrons.</p>

<h3>What are you looking for in the artists who participate, and what qualities do the artworks you showcase need to have?</h3>
<p>Firstly, everything we sell at Scandinavian Art is handpicked. When choosing artworks, I always look for something I like, and something I instantly have a positive response to. Buying art should be an emotive experience after all.</p>
<p>However, I fully understand tastes are varied so I’m always on the lookout for recommendations. Talented people are often the best at spotting other talented people. When it comes to the artists we proudly represent, a close and transparent relationship with them is important, and I keep in touch with them as much as possible especially when it comes to the curatorial decisions of the site.</p>

<h3>If someone is looking to start their own Scandinavian art collection what would be your top three tips?</h3>

<ol>
  <li><strong>Think about your space and style</strong></li>
</ol>
<p>Firstly, it’s important to think about your style. Scandinavian interiors are often so clean and minimal leaving a lot of space for louder art pieces. However, if you already have a busy interior space then a simpler, paired back piece can work best.</p>

<ol start="2">
  <li><strong>Connect with the artist</strong></li>
</ol>
<p>Scandinavia is very much about community, and I think it’s nice to feel that way about art too. You’re not just buying a print but investing in a story, and reading about the artist, and connecting with what inspires them, can make a piece feel much more special.</p>

<ol start="3">
  <li><strong>Always feel welcome to ask</strong></li>
</ol>
<p>Yes, we are an online store, but feel free to reach out to ask questions. Starting to collect can be daunting, but research is important, as well as enjoyable. With us being so familiar with our artists, and the artworks themselves, we can help to guide you throughout.</p>

<h3>Finally, for anyone looking for more art inspiration, what galleries in Oslo would you recommend they visit, and why?</h3>
<p>I think it’s hard to beat the classics, so my first recommendation has to be the National Gallery. The largest museum in the Nordics, and with <strong>6,500</strong> pieces of permanent art, craft and design on display, it’s one of those places you can walk around all day. With a fantastic café on every floor too, once your legs get tired be sure to treat yourself to a coffee and cinnamon bun.</p>
<p>Taking twelve years to complete and set over thirteen floors the Munch museum in Bjørvika is well worth a visit. Beyond seeing The Scream, essentially the Scandinavian Mona Lisa, the art throughout serves as a window into Munch’s life, and how his personal experiences not only shaped his work but would go on and shape an entire visual language.</p>
<p>Finally, another must-visit for me is Vigeland Sculpture Park in Frogner. Oslo’s largest public park, and set within <strong>80-acres</strong>, it’s the perfect place to spend a slow Sunday. Home to over <strong>200</strong> granite, bronze and wrought iron sculptures by Gustav Vigeland, seeing these extraordinary works in such an extraordinary setting makes them all the more powerful.</p>

    `,
    featuredImage: '/images/journal/kitchen.png'
  },
  
];

// Dynamically generate categories from the articles data
export const articleCategories = ['All', ...Array.from(new Set(articles.map(article => article.category)))];

// Helper function to get article by slug
export const getArticleBySlug = (slug: string) => {
  return articles.find(article => article.slug === slug);
};

// Helper function to get article by ID
export const getArticleById = (id: string) => {
  return articles.find(article => article.id === id);
};
