const { enhanceEntityContent } = require('./src/lib/linking/content-enhancer.ts');

const testEntity = {
  id: 'test-gad',
  slug: 'generalized-anxiety-disorder',
  type: 'condition',
  name: 'Generalized Anxiety Disorder',
  data: {
    treatment_approaches: {
      medications: [
        "Buspirone (Buspar)",
        "Sertraline"
      ]
    }
  }
};

enhanceEntityContent(testEntity).then(enhanced => {
  console.log('ENHANCED MEDICATIONS:');
  console.log(JSON.stringify(enhanced.data.treatment_approaches.medications, null, 2));
}).catch(err => {
  console.error('ERROR:', err.message);
});
