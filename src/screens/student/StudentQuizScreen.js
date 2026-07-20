import { useTheme } from '../../context/ThemeContext'
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme';

export default function StudentQuizScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState(null);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/quiz/generate?questions=5');
      if (response.data && response.data.success) {
        setQuiz(response.data.data);
        setCurrentQuestionIndex(0);
        setSelectedChoiceIndex(null);
        setShowAnswer(false);
        setScore(0);
        setIsFinished(false);
      } else {
        setError(t('quiz.err_generate'));
      }
    } catch (err) {
      console.log(err);
      setError(t('quiz.err_network'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChoice = (index) => {
    if (showAnswer) return;
    setSelectedChoiceIndex(index);
  };

  const handleValidate = () => {
    if (selectedChoiceIndex === null) return;
    setShowAnswer(true);
    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (currentQuestion.choices[selectedChoiceIndex].isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedChoiceIndex(null);
      setShowAnswer(false);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerRoot}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 20 }}>{t('quiz.generating')}</Text>
      </SafeAreaView>
    );
  }

  if (isFinished) {
    return (
      <SafeAreaView style={styles.centerRoot}>
        <Text style={styles.title}>{t('quiz.finished_title')}</Text>
        <Text style={styles.scoreText}>{t('quiz.score')} {score} / {quiz.questions.length}</Text>
        <TouchableOpacity style={styles.button} onPress={generateQuiz}>
          <Text style={styles.buttonText}>{t('quiz.retry_btn')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.centerRoot}>
        <Text style={styles.title}>{t('quiz.generator_title')}</Text>
        <Text style={styles.subtitle}>{t('quiz.generator_desc')}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={generateQuiz}>
          <Text style={styles.buttonText}>{t('quiz.generate_btn')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        <Text style={styles.progress}>{t('quiz.question')} {currentQuestionIndex + 1} / {quiz.questions.length}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionText}>{currentQuestion.content}</Text>
        
        {currentQuestion.choices.map((choice, index) => {
          let btnStyle = [styles.choiceBtn];
          let textStyle = [styles.choiceText];
          
          if (showAnswer) {
             if (choice.isCorrect) {
                 btnStyle.push(styles.choiceCorrect);
                 textStyle.push(styles.textCorrect);
             } else if (index === selectedChoiceIndex) {
                 btnStyle.push(styles.choiceIncorrect);
                 textStyle.push(styles.textIncorrect);
             }
          } else if (index === selectedChoiceIndex) {
             btnStyle.push(styles.choiceSelected);
             textStyle.push(styles.textSelected);
          }

          return (
            <TouchableOpacity 
              key={index} 
              style={btnStyle} 
              onPress={() => handleSelectChoice(index)}
              activeOpacity={0.7}
            >
              <Text style={textStyle}>{choice.content}</Text>
            </TouchableOpacity>
          );
        })}

        {showAnswer && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>{t('quiz.explanation')}</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

      </ScrollView>
      <View style={styles.footer}>
        {!showAnswer ? (
          <TouchableOpacity 
             style={[styles.button, selectedChoiceIndex === null && styles.buttonDisabled]} 
             onPress={handleValidate}
             disabled={selectedChoiceIndex === null}
          >
            <Text style={styles.buttonText}>{t('quiz.validate')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{currentQuestionIndex < quiz.questions.length - 1 ? t('quiz.next') : t('quiz.finish')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  centerRoot: { flex: 1, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  header: { padding: Spacing.lg, backgroundColor: themeColors.dark, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  headerTitle: { color: themeColors.textWhite, fontSize: 18, fontWeight: 'bold' },
  progress: { color: themeColors.primary, marginTop: 5 },
  content: { padding: Spacing.lg },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: themeColors.dark, textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 30, color: themeColors.textSecondary },
  questionText: { fontSize: 18, fontWeight: '600', marginBottom: 20, color: themeColors.textPrimary },
  choiceBtn: { backgroundColor: themeColors.surface, padding: 15, borderRadius: Radius.md, borderWidth: 1, borderColor: themeColors.border, marginBottom: 10 },
  choiceSelected: { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '10' },
  choiceCorrect: { borderColor: themeColors.success, backgroundColor: themeColors.success + '10' },
  choiceIncorrect: { borderColor: themeColors.error, backgroundColor: themeColors.error + '10' },
  choiceText: { color: themeColors.textPrimary, fontSize: 16 },
  textSelected: { color: themeColors.primary, fontWeight: 'bold' },
  textCorrect: { color: themeColors.success, fontWeight: 'bold' },
  textIncorrect: { color: themeColors.error, fontWeight: 'bold' },
  explanationBox: { marginTop: 20, padding: 15, backgroundColor: themeColors.info + '10', borderRadius: Radius.md, borderWidth: 1, borderColor: themeColors.info },
  explanationTitle: { fontWeight: 'bold', color: themeColors.info, marginBottom: 5 },
  explanationText: { color: themeColors.textPrimary },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: themeColors.border, backgroundColor: themeColors.surface },
  button: { backgroundColor: themeColors.primary, padding: 15, borderRadius: Radius.full, alignItems: 'center', width: '100%' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: themeColors.textWhite, fontSize: 16, fontWeight: 'bold' },
  scoreText: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: themeColors.primary },
  errorText: { color: themeColors.error, marginBottom: 20, textAlign: 'center' }
});
