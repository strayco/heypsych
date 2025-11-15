import fs from 'fs';
import path from 'path';

// FDA approval years for psychiatric medications
// Source: FDA Orange Book and drug labels
const approvalYears: Record<string, number> = {
  // Antidepressants - SSRIs
  'fluoxetine-prozac': 1987,
  'fluoxetine': 1987,
  'sertraline-zoloft': 1991,
  'sertraline': 1991,
  'paroxetine-paxil': 1992,
  'paroxetine': 1992,
  'citalopram-celexa': 1998,
  'citalopram': 1998,
  'escitalopram-lexapro': 2002,
  'escitalopram': 2002,
  'fluvoxamine-luvox': 1994,
  'fluvoxamine': 1994,

  // Antidepressants - SNRIs
  'venlafaxine-effexor': 1993,
  'venlafaxine': 1993,
  'duloxetine-cymbalta': 2004,
  'duloxetine': 2004,
  'desvenlafaxine-pristiq': 2008,
  'desvenlafaxine': 2008,
  'levomilnacipran-fetzima': 2013,
  'levomilnacipran': 2013,

  // Antidepressants - Atypical
  'bupropion-wellbutrin': 1985,
  'bupropion': 1985,
  'mirtazapine-remeron': 1996,
  'mirtazapine': 1996,
  'trazodone-desyrel': 1981,
  'trazodone': 1981,
  'nefazodone-serzone': 1994,
  'nefazodone': 1994,
  'vilazodone-viibryd': 2011,
  'vilazodone': 2011,
  'vortioxetine-trintellix': 2013,
  'vortioxetine': 2013,

  // Antidepressants - TCAs
  'amitriptyline-elavil': 1961,
  'amitriptyline': 1961,
  'nortriptyline-pamelor': 1964,
  'nortriptyline': 1964,
  'imipramine-tofranil': 1959,
  'imipramine': 1959,
  'desipramine-norpramin': 1964,
  'desipramine': 1964,
  'clomipramine-anafranil': 1989,
  'clomipramine': 1989,
  'doxepin-sinequan': 1969,
  'doxepin': 1969,
  'trimipramine-surmontil': 1979,
  'trimipramine': 1979,
  'amoxapine-asendin': 1980,
  'amoxapine': 1980,
  'protriptyline-vivactil': 1967,
  'protriptyline': 1967,

  // Antidepressants - MAOIs
  'phenelzine-nardil': 1961,
  'phenelzine': 1961,
  'tranylcypromine-parnate': 1961,
  'tranylcypromine': 1961,
  'isocarboxazid-marplan': 1959,
  'isocarboxazid': 1959,
  'selegiline-emsam': 2006,
  'selegiline': 2006,

  // Antipsychotics - First Generation
  'chlorpromazine-thorazine': 1954,
  'chlorpromazine': 1954,
  'haloperidol-haldol': 1967,
  'haloperidol': 1967,
  'fluphenazine-prolixin': 1959,
  'fluphenazine': 1959,
  'perphenazine-trilafon': 1957,
  'perphenazine': 1957,
  'trifluoperazine-stelazine': 1958,
  'trifluoperazine': 1958,
  'thiothixene-navane': 1967,
  'thiothixene': 1967,
  'loxapine-loxitane': 1975,
  'loxapine': 1975,

  // Antipsychotics - Second Generation
  'clozapine-clozaril': 1989,
  'clozapine': 1989,
  'risperidone-risperdal': 1993,
  'risperidone': 1993,
  'olanzapine-zyprexa': 1996,
  'olanzapine': 1996,
  'quetiapine-seroquel': 1997,
  'quetiapine': 1997,
  'ziprasidone-geodon': 2001,
  'ziprasidone': 2001,
  'aripiprazole-abilify': 2002,
  'aripiprazole': 2002,
  'paliperidone-invega': 2006,
  'paliperidone': 2006,
  'asenapine-saphris': 2009,
  'asenapine': 2009,
  'iloperidone-fanapt': 2009,
  'iloperidone': 2009,
  'lurasidone-latuda': 2010,
  'lurasidone': 2010,
  'brexpiprazole-rexulti': 2015,
  'brexpiprazole': 2015,
  'cariprazine-vraylar': 2015,
  'cariprazine': 2015,
  'lumateperone-caplyta': 2019,
  'lumateperone': 2019,

  // Mood Stabilizers
  'lithium-carbonate': 1970,
  'lithium': 1970,
  'valproic-acid-depakote': 1983,
  'valproic-acid': 1983,
  'divalproex-depakote': 1983,
  'divalproex': 1983,
  'carbamazepine-tegretol': 1974,
  'carbamazepine': 1974,
  'lamotrigine-lamictal': 1994,
  'lamotrigine': 1994,
  'oxcarbazepine-trileptal': 2000,
  'oxcarbazepine': 2000,

  // Anxiolytics - Benzodiazepines
  'alprazolam-xanax': 1981,
  'alprazolam': 1981,
  'lorazepam-ativan': 1977,
  'lorazepam': 1977,
  'clonazepam-klonopin': 1975,
  'clonazepam': 1975,
  'diazepam-valium': 1963,
  'diazepam': 1963,
  'chlordiazepoxide-librium': 1960,
  'chlordiazepoxide': 1960,
  'oxazepam-serax': 1965,
  'oxazepam': 1965,
  'temazepam-restoril': 1981,
  'temazepam': 1981,
  'triazolam-halcion': 1982,
  'triazolam': 1982,
  'clorazepate-tranxene': 1972,
  'clorazepate': 1972,

  // Anxiolytics - Other
  'buspirone-buspar': 1986,
  'buspirone': 1986,
  'hydroxyzine-vistaril': 1956,
  'hydroxyzine': 1956,

  // ADHD Medications - Stimulants
  'methylphenidate-ritalin': 1955,
  'methylphenidate': 1955,
  'dexmethylphenidate-focalin': 2001,
  'dexmethylphenidate': 2001,
  'amphetamine-adderall': 1996,
  'amphetamine': 1996,
  'dextroamphetamine-dexedrine': 1976,
  'dextroamphetamine': 1976,
  'lisdexamfetamine-vyvanse': 2007,
  'lisdexamfetamine': 2007,

  // ADHD Medications - Non-Stimulants
  'atomoxetine-strattera': 2002,
  'atomoxetine': 2002,
  'guanfacine-intuniv': 2009,
  'guanfacine': 2009,
  'clonidine-kapvay': 2010,
  'clonidine': 2010,
  'viloxazine-qelbree': 2021,
  'viloxazine': 2021,

  // Sleep Medications
  'zolpidem-ambien': 1992,
  'zolpidem': 1992,
  'eszopiclone-lunesta': 2004,
  'eszopiclone': 2004,
  'zaleplon-sonata': 1999,
  'zaleplon': 1999,
  'ramelteon-rozerem': 2005,
  'ramelteon': 2005,
  'suvorexant-belsomra': 2014,
  'suvorexant': 2014,
  'lemborexant-dayvigo': 2019,
  'lemborexant': 2019,
  'daridorexant-quviviq': 2022,
  'daridorexant': 2022,

  // Cognitive Enhancers
  'donepezil-aricept': 1996,
  'donepezil': 1996,
  'rivastigmine-exelon': 2000,
  'rivastigmine': 2000,
  'galantamine-razadyne': 2001,
  'galantamine': 2001,
  'memantine-namenda': 2003,
  'memantine': 2003,
  'modafinil-provigil': 1998,
  'modafinil': 1998,
  'armodafinil-nuvigil': 2007,
  'armodafinil': 2007,

  // Substance Use Disorder
  'naltrexone-revia': 1984,
  'naltrexone': 1984,
  'acamprosate-campral': 2004,
  'acamprosate': 2004,
  'disulfiram-antabuse': 1951,
  'disulfiram': 1951,
  'buprenorphine-subutex': 2002,
  'buprenorphine': 2002,
  'buprenorphine-naloxone-suboxone': 2002,
  'varenicline-chantix': 2006,
  'varenicline': 2006,

  // Newer/Recent Approvals
  'esketamine-spravato': 2019,
  'esketamine': 2019,
  'pimavanserin-nuplazid': 2016,
  'pimavanserin': 2016,
  'dextromethorphan-bupropion-auvelity': 2022,
  'zuranolone-zurzuvae': 2023,
  'brivaracetam-briviact': 2016,

  // Extended Release / Long-Acting Formulations
  'aripiprazole-lai-abilify-maintena': 2013,
  'aripiprazole-lauroxil-aristada': 2015,
  'risperidone-lai-risperdal-consta': 2003,
  'paliperidone-palmitate-6mo-invega-hafyera': 2021,
  'methylphenidate-er-concerta': 2000,
  'zolpidem-cr-ambien-cr': 2005,
  'clonidine-er-kapvay': 2010,
  'methylphenidate-transdermal-daytrana': 2006,
  'viloxazine-ir': 2021,

  // Combination Products
  'fluoxetine-olanzapine-symbyax': 2003,
  'amitriptyline-chlordiazepoxide-limbitrol': 1973,
  'mixed-amphetamine-salts-adderall': 1996,
  'buprenorphine-nalmefene': 2023,

  // Anticonvulsants / Mood Stabilizers (Additional)
  'ethosuximide-zarontin': 1960,
  'pregabalin-lyrica': 2004,

  // Antihistamines (Sleep/Anxiety)
  'diphenhydramine-benadryl': 1946,
  'hydroxyzine-atarax': 1956,
  'cyproheptadine-periactin': 1961,
  'doxylamine': 1948,

  // Anti-Nausea (Sometimes used for anxiety)
  'ondansetron-zofran': 1991,

  // Additional Antipsychotics
  'molindone-moban': 1974,
  'thioridazine-mellaril': 1959,

  // International/European Medications
  'agomelatine-valdoxan': 2009,  // EU approval
  'amisulpride-solian': 1986,     // First marketed in France
  'amisulpride': 1986,
  'flupentixol-depixol': 1965,    // First marketed in Europe
  'tiapride-tiapridal': 1976,     // First marketed in France
  'perospirone': 2001,             // Japan approval
  'blonanserin': 2008,             // Japan approval
  'levomepromazine': 1959,         // First marketed in Europe
  'melperone': 1963,               // First marketed in Europe
  'zopiclone-imovane': 1986,       // First marketed in Europe
  'periciazine': 1957,             // First marketed in Europe
  'clopenthixol': 1961,            // First marketed in Europe
  'remoxipride': 1990,             // Sweden approval (withdrawn 1993)
  'milnacipran-savella': 2009,     // FDA (approved earlier in Europe/Asia)
  'setiptiline': 1972,             // Japan approval

  // Barbiturates (Historical)
  'amobarbital-amytal': 1923,
  'aprobarbital': 1923,
  'secobarbital-seconal': 1934,
  'thiopental-pentothal': 1936,
  'hexobarbital': 1932,
  'cyclobarbital': 1952,

  // Other Sedatives/Hypnotics (Historical)
  'chloral-hydrate': 1869,
  'meprobamate-miltown': 1955,
  'methaqualone-quaalude': 1965,
  'bromazepam-lexotan': 1963,
  'cinolazepam': 1993,

  // Alpha Blockers / Blood Pressure (Used for PTSD/Nightmares)
  'prazosin-minipress': 1976,

  // Cognitive Enhancers / Nootropics
  'hydergine': 1951,
  'aniracetam': 1978,  // First synthesized/available
  'pramiracetam': 1984, // First synthesized/available

  // Parkinson's/MAO-B Inhibitors
  'rasagiline-azilect': 2006,
  'safinamide-xadago': 2017,

  // Sleep Medications (Additional)
  'tasimelteon-hetlioz': 2014,

  // Smoking Cessation (Additional)
  'nicotine-patch-nicoderm': 1991,

  // Other Historical/Discontinued Medications
  'amineptine-survector': 1978,  // France (withdrawn 1999)

  // Additional Anticonvulsants / Mood Stabilizers
  'gabapentin-neurontin': 1993,
  'topiramate-topamax': 1996,
  'levetiracetam-keppra': 1999,
  'lacosamide-vimpat': 2008,
  'eslicarbazepine-aptiom': 2013,
  'perampanel-fycompa': 2012,
  'carbamazepine-er-tegretol-xr': 1996,
  'clobazam-onfi': 2011,
  'felbamate-felbatol': 1993,
  'rufinamide-banzel': 2008,
  'stiripentol-diacomit': 2018,
  'tiagabine-gabitril': 1997,
  'vigabatrin-sabril': 2009,
  'zonisamide-zonegran': 2000,
  'primidone-mysoline': 1954,
  'phenobarbital': 1912,

  // Valproate Formulations
  'divalproex-sodium-depakote': 1983,
  'valproic-acid-depakene': 1978,
  'valproate-sodium': 1978,
  'valproate-semisodiumdivalproex': 1983,
  'valproate-magnesium': 1995,
  'valnoctamide': 1964,

  // Additional Benzodiazepines
  'flurazepam-dalmane': 1970,
  'estazolam-prosom': 1990,
  'quazepam-doral': 1985,
  'flunitrazepam-rohypnol': 1975,
  'flunitrazepam-lower-dose-hypnodorm': 1975,
  'etizolam': 1984,
  'nitrazepam': 1965,
  'loprazolam': 1983,
  'lormetazepam': 1980,
  'midazolam-versed': 1985,
  'prazepam': 1977,
  'camazepam': 1982,

  // Additional Barbiturates
  'butabarbital-butisol': 1950,
  'butalbital': 1951,
  'talbutal': 1950,
  'glutethimide-doriden': 1954,
  'methohexital-brevital': 1960,

  // Additional Sedatives
  'baclofen': 1977,
  'clomethiazole-heminevrin': 1966,
  'tofizopam': 1986,
  'low-dose-doxepin-silenor': 2010,

  // Antipsychotics - Additional LAI Formulations
  'fluphenazine-decanoate-prolixin-decanoate': 1973,
  'flupentixol-depot-depixol-depot': 1968,
  'perphenazine-enanthate': 1966,
  'olanzapine-pamoate-zyprexa-relprevv': 2009,
  'paliperidone-palmitate-invega-sustenna': 2009,
  'paliperidone-palmitate-3mo-invega-trinza': 2015,
  'risperidone-microsphereslai': 2003,
  'loxapine-inhalation-adasuve': 2012,

  // Additional Antipsychotics
  'droperidol-inapsine': 1970,
  'mesoridazine-serentil': 1970,
  'pimozide-orap': 1984,
  'prochlorperazine-compazine': 1956,
  'sertindole-serdolect': 1996,
  'sulpiride-dogmatil': 1968,
  'sulpiride-dolmatil': 1968,
  'zuclopenthixol-clopixol': 1978,
  'zotepine': 1990,

  // Antidepressants - Additional
  'maprotiline-ludiomil': 1980,
  'mianserin-tolvon': 1979,
  'reboxetine-edronax': 1997,
  'tianeptine-stablon': 1988,
  'nomifensine-merital': 1977,
  'moclobemide-aurorix': 1990,
  'iproniazid': 1958,
  'mosapramine': 1994,

  // Antidepressant Combinations / Extended Release
  'bupropion-sr-zyban': 1997,
  'quetiapine-er-seroquel-xr': 2007,
  'quetiapine-nortriptyline': 2007,
  'viloxazine-er-qelbree': 2021,
  'perphenazine-amitriptyline-triavil': 1965,
  'chlorpromazine-promethazine': 1956,

  // ADHD - Additional
  'methamphetamine-desoxyn': 1944,

  // Addiction Treatment
  'methadone-dolophine': 1947,
  'naloxone-narcan': 1971,
  'naltrexone-er-vivitrol': 2006,
  'naltrexone-bupropion-contrave': 2014,
  'nalmefene-selincro': 2013,
  'lofexidine-lucemyra': 2018,
  'nicotine-gum-nicorette': 1984,
  'nicotine-lozenge': 2002,

  // Neurological/Cognitive
  'selegiline-eldepryl': 1989,
  'idebenone': 1986,
  'nicergoline': 1972,
  'citicoline': 1978,
  'vinpocetine': 1987,
  'piracetam': 1971,

  // Supplements / Herbal
  'bacopa-monnieri': 1500,  // Traditional use, modern supplements ~1990s
  'hypericin': 1988,  // St. John's Wort extract standardization

  // Alpha-2 Agonists
  'clonidine-catapres': 1974,

  // Beta Blockers (Anxiety)
  'propranolol-inderal': 1967,

  // Antihistamines - Additional
  'promethazine-phenergan': 1951,

  // Specialized Use
  'dapoxetine-priligy': 2009,  // Premature ejaculation (SSRrelated)
  'cannabidiol-epidiolex': 2018,
  'ketamine': 1970,
  'brexanolone-zulresso': 2019,
  'metformin-antipsychotic-weight-gain-glucophage': 1995,

  // Formulation Variants (same drug, different indication/name)
  'amisulpride-low-dose-for-depression': 1986,
  'aripiprazole-lauroxil': 2015,
};

const medicationsDir = path.join(process.cwd(), 'data', 'treatments', 'medications');

function addApprovalDates() {
  const files = fs.readdirSync(medicationsDir).filter(f => f.endsWith('.json'));
  let updated = 0;
  let skipped = 0;

  // Create a lowercase version of the approval years map for case-insensitive lookup
  const approvalYearsLower: Record<string, number> = {};
  for (const [key, value] of Object.entries(approvalYears)) {
    approvalYearsLower[key.toLowerCase()] = value;
  }

  console.log(`Processing ${files.length} medication files...`);

  for (const file of files) {
    const filePath = path.join(medicationsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const medication = JSON.parse(fileContent);

    // Get the base name without extension for lookup (case-insensitive)
    const baseName = file.replace('.json', '');
    const baseNameLower = baseName.toLowerCase();
    const approvalYear = approvalYearsLower[baseNameLower];

    if (approvalYear) {
      // Add or update the fda_approval_year in metadata
      if (!medication.metadata) {
        medication.metadata = {};
      }

      medication.metadata.fda_approval_year = approvalYear;

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(medication, null, 2) + '\n');
      updated++;
      console.log(`✓ ${baseName}: ${approvalYear}`);
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Updated ${updated} files`);
  console.log(`⏭️  Skipped ${skipped} files (no approval date found)`);
  console.log(`\n💡 Tip: For skipped files, they will sort to the end when using date sorting`);
}

addApprovalDates();
