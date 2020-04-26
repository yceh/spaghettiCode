CREATE TABLE article (
  pubmedID INT PRIMARY KEY,
  abstract TEXT,
  PMCID TINYTEXT,
  doi TINYTEXT,
  mutagen TINYTEXT,
  knockOut TINYTEXT,
  excludeReason INT);
CREATE TABLE excludeReason(
  reason TEXT,
  id INT AUTO_INCREMENT PRIMARY KEY);
CREATE TABLE meshTerm(
  id VARCHAR(64) CHARACTER SET ascii PRIMARY KEY,
  description TEXT);
CREATE TABLE chemicalTerm(
  id VARCHAR(64) CHARACTER SET ascii PRIMARY KEY,
  description TEXT);
CREATE TABLE articleMesh(
  pubmedID INT NOT NULL,
  meshID VARCHAR(64),
  INDEX(pubmedID));
CREATE TABLE articleChemical(
  pubmedID INT NOT NULL,
  chemicalID VARCHAR(64),
  INDEX(pubmedID));
CREATE TABLE articleKeyword(
  pubmedID INT NOT NULL,
  keyword VARCHAR(64),
  INDEX(pubmedID));
CREATE TABLE acceptWord(
  word NVARCHAR(64) NOT NULL,
  context TEXT,
  id INT AUTO_INCREMENT PRIMARY KEY,
  INDEX(word));
CREATE TABLE rejectWord(
  word NVARCHAR(64) NOT NULL,
  context TEXT,
  id INT AUTO_INCREMENT PRIMARY KEY,
  INDEX(word));
CREATE TABLE articleWord(
  pubmedID INT,
  cidx INT,
  wordRuleIdx INT);
DELIMITER //
CREATE OR REPLACE PROCEDURE updateExcludeReason(thisId INT,excludeReason TEXT) MODIFIES SQL DATA BEGIN DECLARE reasonId TYPE OF article.excludeReason; SELECT id INTO reasonId FROM excludeReason WHERE reason= excludeReason; IF reasonId IS NULL THEN INSERT INTO excludeReason(reason) VALUES(excludeReason); SET reasonId=LAST_INSERT_ID(); END IF; UPDATE article SET excludeReason=reasonID WHERE pubmedID=thisId; END//
CREATE OR REPLACE PROCEDURE insertKeywordAccept(thisId INT,
  keyword TYPE OF acceptWord.word,
  contextword TYPE OF acceptWord.context)
MODIFIES SQL DATA 
BEGIN 
  DECLARE wordId TYPE OF acceptWord.id;
  SELECT id INTO wordId FROM acceptWord
    WHERE word=keyword && context=contextword;
  IF wordId IS NULL THEN 
    INSERT INTO acceptWord(word,context) VALUES(keyword,contextword);
    SET wordId=LAST_INSERT_ID();
  END IF;
  INSERT INTO articleWord(pubmedID,wordRuleIdx) VALUES(thisId,wordId);
END//
CREATE OR REPLACE PROCEDURE insertKeywordReject(thisId INT,
  keyword TYPE OF rejectWord.word,
  contextword TYPE OF rejectWord.context)
MODIFIES SQL DATA 
BEGIN 
  DECLARE wordId TYPE OF rejectWord.id;
  SELECT id INTO wordId FROM rejectWord
    WHERE word=keyword && context=contextword;
  IF wordId IS NULL THEN 
    INSERT INTO rejectWord(word,context) VALUES(keyword,contextword);
    SET wordId=LAST_INSERT_ID();
  END IF;
  INSERT INTO articleWord(pubmedID,wordRuleIdx) VALUES(thisId,wordId);
END//
DELIMITER;
