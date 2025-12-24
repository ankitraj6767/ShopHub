import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchProductQuestions,
  askQuestion,
  answerQuestion,
  voteAnswer,
  clearQuestionError,
} from '../../store/slices/questionSlice';
import Spinner from './Spinner';
import Pagination from './Pagination';

// Safe date format helper
const safeFormatDistanceToNow = (date, options = {}) => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return formatDistanceToNow(dateObj, options);
  } catch {
    return '';
  }
};

const ProductQuestions = ({ productId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const questionsState = useSelector((state) => state.questions) || {};
  const {
    questions = [],
    totalQuestions = 0,
    page = 1,
    pages = 1,
    loading = false,
    error = null,
    askingQuestion = false,
    answeringQuestion = false,
  } = questionsState;

  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductQuestions({ productId, page: 1 }));
    }
  }, [dispatch, productId]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const result = await dispatch(askQuestion({ productId, question: questionText }));
    if (result.meta?.requestStatus === 'fulfilled') {
      setQuestionText('');
      setShowQuestionForm(false);
      // Refresh questions list
      dispatch(fetchProductQuestions({ productId, page: 1 }));
    }
  };

  const handleAnswerQuestion = async (e, questionId) => {
    e.preventDefault();
    if (!answerText.trim()) return;

    const result = await dispatch(answerQuestion({ questionId, answer: answerText }));
    if (result.meta?.requestStatus === 'fulfilled') {
      setAnswerText('');
      setAnsweringId(null);
      // Refresh questions list
      dispatch(fetchProductQuestions({ productId, page: 1 }));
    }
  };

  const handleVoteAnswer = (questionId, answerId, helpful) => {
    dispatch(voteAnswer({ questionId, answerId, helpful }));
  };

  const handlePageChange = (newPage) => {
    dispatch(fetchProductQuestions({ productId, page: newPage }));
  };

  if (loading && (!questions || questions.length === 0)) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  // Safety check for questions array
  const safeQuestions = Array.isArray(questions) ? questions : [];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold dark:text-white">
          Customer Questions & Answers ({totalQuestions})
        </h2>
        {user && !showQuestionForm && (
          <button
            onClick={() => setShowQuestionForm(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Ask a Question
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={() => dispatch(clearQuestionError())}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Ask Question Form */}
      {showQuestionForm && (
        <form onSubmit={handleAskQuestion} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium mb-3 dark:text-white">Ask a Question</h3>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="What would you like to know about this product?"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            rows="3"
            required
          />
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={askingQuestion}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              {askingQuestion ? 'Submitting...' : 'Submit Question'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQuestionForm(false);
                setQuestionText('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      {safeQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {safeQuestions.map((question) => (
            <div key={question._id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
              {/* Question */}
              <div className="flex items-start gap-3">
                <span className="font-bold text-lg text-gray-700 dark:text-gray-300">Q:</span>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{question.question}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Asked by {question.user?.name || 'Anonymous'} •{' '}
                    {safeFormatDistanceToNow(question.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Answers */}
              {question.answers && question.answers.length > 0 && (
                <div className="mt-4 ml-8 space-y-4">
                  {question.answers.map((answer) => (
                    <div
                      key={answer._id}
                      className={`p-3 rounded-lg ${
                        answer.isSeller ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-lg text-gray-700 dark:text-gray-300">A:</span>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white">{answer.answer}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-500">
                              {answer.isSeller && (
                                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded mr-2">
                                  Seller
                                </span>
                              )}
                              By {answer.user?.name || 'Anonymous'} •{' '}
                              {safeFormatDistanceToNow(answer.createdAt, { addSuffix: true })}
                            </p>
                            {user && (
                              <div className="flex items-center gap-4 text-sm">
                                <button
                                  onClick={() => handleVoteAnswer(question._id, answer._id, true)}
                                  className="flex items-center gap-1 text-gray-500 hover:text-green-600"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                    />
                                  </svg>
                                  <span>Helpful ({answer.helpfulVotes || 0})</span>
                                </button>
                                <button
                                  onClick={() => handleVoteAnswer(question._id, answer._id, false)}
                                  className="flex items-center gap-1 text-gray-500 hover:text-red-600"
                                >
                                  <svg
                                    className="w-4 h-4 rotate-180"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                    />
                                  </svg>
                                  <span>({answer.notHelpfulVotes || 0})</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {user && answeringId === question._id ? (
                <form
                  onSubmit={(e) => handleAnswerQuestion(e, question._id)}
                  className="mt-4 ml-8 p-3 bg-gray-50 rounded-lg"
                >
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows="3"
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={answeringQuestion}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                    >
                      {answeringQuestion ? 'Submitting...' : 'Submit Answer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnsweringId(null);
                        setAnswerText('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                user && (
                  <button
                    onClick={() => setAnsweringId(question._id)}
                    className="mt-3 ml-8 text-sm text-yellow-600 hover:text-yellow-700"
                  >
                    + Add an answer
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6">
          <Pagination page={page} pages={pages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Login prompt */}
      {!user && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            <a href="/login" className="text-yellow-600 hover:underline">
              Sign in
            </a>{' '}
            to ask a question or answer others.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductQuestions;
