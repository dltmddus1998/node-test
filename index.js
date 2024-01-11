import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import fs, { readFile, readFileSync, unlinkSync } from 'fs';
import sw from 'stopword';
import util from 'util';
import { join, resolve } from 'path';
import { exec, spawn } from 'child_process';
dotenv.config();

const execAsync = util.promisify(exec);

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const findMatchingCheckRuleName = (arr, targetWord) => {
  // console.log(targetWord);
  if (arr.includes(targetWord)) {
    return true;
  }
  return false;
};

const containsPartialWord = (inputString, targetWords) => {
  const words = inputString.split(' ');

  if (targetWords.includes(',')) {
    for (const word of words) {
      for (const targetWord of targetWords.split(',')) {
        if (targetWord.includes(word)) {
          return true;
        }
      }
    }
    return false;
  }
};

const updateD2 = async (filename) => {
  let d2Data = readFileSync(`./d2/${filename}.d2`, 'utf-8');
  const topologyData = fs.readFileSync('./topology-data/vpc.json');
  const topology = JSON.parse(topologyData);

  Object.keys(topology).forEach((variable) => {
    const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
    d2Data = d2Data.replaceAll(regex, topology[variable]);
  });

  fs.writeFileSync(`./d2/${filename}.d2`, d2Data);
};

app.get('/sec-similar-matching2', async (req, res) => {
  const checkRuleNameList = fs.readFileSync('./process/awsCheckRuleNameList.json', 'utf-8');
  const securityTermList = fs.readFileSync('./process/mappedSecurityTermList.json', 'utf-8');

  const matchedArr = [];
  if (checkRuleNameList && securityTermList) {
    const securityTermArr = [];
    const forIdx = [];
    const wordArr = [];
    const matchingWordOfST = [];
    const onlyWordArrs = [];
    const eachWordOfSTArr = [];

    const parsedCheckRuleNameList = JSON.parse(checkRuleNameList);
    const parsedSecurityTermList = JSON.parse(securityTermList);

    parsedSecurityTermList.forEach((securityTerm) => {
      securityTermArr.push(securityTerm['securityTerm']);
    });

    securityTermArr.forEach((securityTerm, i) => {
      const eachWordOfST = securityTerm.split(' ');
      matchingWordOfST.push({
        index: i,
        eachWordOfST,
      });
    });
    matchingWordOfST.forEach((data) => {
      eachWordOfSTArr.push(data['eachWordOfST']);
    });

    /**
     * onlyWordArrs -> security term 분리된 단어, index
     */

    eachWordOfSTArr.forEach((word, idx) => {
      for (let i of word) {
        onlyWordArrs.push({
          termWord: i,
          idx,
        });
      }
    });

    securityTermArr.forEach((word, idx) => {
      forIdx.push({
        termWord: word,
        idx,
      });
    });

    onlyWordArrs.forEach((ob) => {
      wordArr.push(ob.termWord);
    });

    parsedCheckRuleNameList.forEach((checkRuleName) => {
      const matched = findMatchingWords(checkRuleName['description'], onlyWordArrs, forIdx);
      const setMatched = new Set(matched);
      const setMathcedArr = [...setMatched];

      if (matched !== undefined)
        matchedArr.push({
          no: checkRuleName['No'],
          checkRuleName: checkRuleName['checkRuleName'],
          matched: setMathcedArr,
          description: checkRuleName['description'],
        });
    });
    /**
     * ✓ description - security terms 매칭
     *
     * -> Next: 같은 checkRuleName끼리 매핑
     */
    return res.json({
      matchedArr,
    });
  }
});
const findMatchingWordsWithCheckRuleName = (listWords, securityTermsArr, result) => {
  const matchingWords = [];
  if (Array.isArray(securityTermsArr) && listWords) {
    for (let i = 0; i < listWords.length; i++) {
      securityTermsArr.forEach((word) => {
        if (word.toLowerCase().includes(listWords[i])) {
          matchingWords.push({ checkRuleName: result, securityTerms: word, listWord: listWords[i] });
        }
      });
    }
  }

  if (matchingWords.length > 0) return matchingWords;
};

const containsWord = (inputString, targetWord) => {
  const words = inputString.split(' ');

  for (let word of words) {
    if (word === targetWord) {
      return true;
    }
  }
  return false;
};

const findMatchingSeed = (seedWord, checkRuleNameArr) => {
  const matchingWords = [];

  if (Array.isArray(checkRuleNameArr) && seedWord) {
    checkRuleNameArr.forEach((checkRuleName) => {
      if (seedWord.includes(checkRuleName)) {
        matchingWords.push(checkRuleName);
      }
    });
  }

  return matchingWords;
};

const findMatchingWords = (sentence, wordArr, forIdx) => {
  const matchingWords = [];
  const securityTerms = [];
  if (Array.isArray(wordArr) && sentence) {
    wordArr.forEach((w) => {
      if (sentence.includes(w.termWord) && w['termWord'] !== 'of') {
        securityTerms.push(forIdx[w['idx']]['termWord']);
      }
    });
  }

  if (matchingWords.length > 0) {
    return securityTerms;
  }
};

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
