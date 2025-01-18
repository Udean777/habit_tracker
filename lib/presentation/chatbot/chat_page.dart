import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:habit_tracker/presentation/chatbot/models/chat_history.dart';
import 'package:habit_tracker/presentation/chatbot/models/chat_message.dart';
import 'package:habit_tracker/presentation/chatbot/models/chat_models.dart';
import 'package:habit_tracker/presentation/chatbot/repositories/chat_repository.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  /// A controller for the text input field.
  final TextEditingController _textController = TextEditingController();

  /// A list to store the chat histories.
  final List<ChatHistory> _chatHistories = [];

  /// The currently selected chat history.
  ChatHistory? _selectedChat;

  /// A flag to indicate if a loading process is ongoing.
  bool _isLoading = false;

  /// A flag to indicate if the sidebar is open.
  bool _isSidebarOpen = false;

  /// The repository for managing chat data.
  late final ChatRepository _chatRepository;

  final List<Map<String, String>> _models = [
    {
      'id': 'gemini-2.0-flash-exp',
      'name': '2.0 Flash (Experimental)',
    },
    {
      'id': 'gemini-1.5-flash-8b',
      'name': '1.5 Flash',
    },
  ];

  String _selectedModel = 'gemini-2.0-flash-exp';

  @override
  void dispose() {
    /// Disposes the text controller when the widget is removed from the widget tree.
    _textController.dispose();
    super.dispose();
  }

  /// The generative model used for chat responses.
  final model = GenerativeModel(
    model: 'gemini-2.0-flash-exp',
    apiKey: dotenv.env['GEMINI_API_KEY']!,
  );

  /// The chat session for the current chat.
  late final ChatSession chat;

  @override
  void initState() {
    super.initState();

    /// Initializes the chat repository and loads chats when the widget is first created.
    _initializeRepository();
    _initializeModel();
  }

  void _initializeModel() {}

  void _onModelChanged(String? newModel) {
    if (newModel != null) {
      setState(() {
        _selectedModel = newModel;
        _initializeModel(); // Reinitialize model with the new selection
      });
    }
  }

  /// Initializes the chat repository and loads chat histories.
  Future<void> _initializeRepository() async {
    _chatRepository = ChatRepository();
    await _chatRepository.init();
    await _loadChats();
    if (_chatHistories.isEmpty) {
      _createNewChat();
    } else {
      setState(() {
        _selectedChat = _chatHistories.first;
      });
    }
  }

  /// Loads chat histories from the repository.
  Future<void> _loadChats() async {
    final savedChats = await _chatRepository.getAllChats();
    setState(() {
      _chatHistories.clear();
      for (var savedChat in savedChats) {
        _chatHistories.add(ChatHistory(
          id: savedChat.id,
          title: savedChat.title,
          createdAt: savedChat.createdAt,
          messages: savedChat.messages
              .map((m) => ChatMessage(
                    content: m.content,
                    isUserMessage: m.isUserMessage,
                    timestamp: m.timestamp,
                  ))
              .toList(),
          model: model,
        ));
      }
    });
  }

  /// Creates a new chat history and saves it to the repository.
  Future<void> _createNewChat() async {
    final newChat = ChatHistory(
      id: const Uuid().v4(),
      title: 'New Chat',
      createdAt: DateTime.now(),
      messages: [],
      model: model,
    );

    final newChatHive = ChatHistoryHive(
      id: newChat.id,
      title: newChat.title,
      createdAt: newChat.createdAt,
      messages: [],
    );

    await _chatRepository.saveChat(newChatHive);

    setState(() {
      _chatHistories.add(newChat);
      _selectedChat = newChat;
    });
  }

  /// Sends a message and handles the response from the chat model.
  Future<void> _sendMessage() async {
    if (_textController.text.trim().isEmpty || _selectedChat == null) return;

    final userMessage = _textController.text;
    final newMessage = ChatMessage(
      content: userMessage,
      isUserMessage: true,
    );

    final newMessageHive = ChatMessageHive(
      content: userMessage,
      isUserMessage: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      _selectedChat!.messages.add(newMessage);
      _isLoading = true;
      _textController.clear();

      if (_selectedChat!.messages.length == 1) {
        _selectedChat!.title = userMessage.length > 30
            ? '${userMessage.substring(0, 30)}...'
            : userMessage;
        _chatRepository.updateChatTitle(
            _selectedChat!.id, _selectedChat!.title);
      }
    });

    await _chatRepository.addMessageToChat(_selectedChat!.id, newMessageHive);

    try {
      final response =
          await _selectedChat!.chat.sendMessage(Content.text(userMessage));
      final responseText = response.text;

      if (mounted) {
        final aiMessage = ChatMessage(
          content: responseText ?? 'No response',
          isUserMessage: false,
        );

        final aiMessageHive = ChatMessageHive(
          content: responseText ?? 'No response',
          isUserMessage: false,
          timestamp: DateTime.now(),
        );

        setState(() {
          _selectedChat!.messages.add(aiMessage);
          _isLoading = false;
        });

        await _chatRepository.addMessageToChat(
            _selectedChat!.id, aiMessageHive);
      }
    } catch (e) {
      if (mounted) {
        final errorMessage = ChatMessage(
          content: 'Error: $e',
          isUserMessage: false,
        );

        final errorMessageHive = ChatMessageHive(
          content: 'Error: $e',
          isUserMessage: false,
          timestamp: DateTime.now(),
        );

        setState(() {
          _selectedChat!.messages.add(errorMessage);
          _isLoading = false;
        });

        await _chatRepository.addMessageToChat(
            _selectedChat!.id, errorMessageHive);
      }
    }
  }

  /// Selects a chat history and closes the sidebar.
  void _selectChat(ChatHistory chatHistory) {
    setState(() {
      _selectedChat =
          _chatHistories.firstWhere((chat) => chat.id == chatHistory.id);
      _isSidebarOpen = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              setState(() {
                _isSidebarOpen = !_isSidebarOpen;
              });
            },
          ),
          actions: const [
            Icon(Icons.more_horiz),
          ],
          title: Padding(
            padding: const EdgeInsets.only(
              top: 8.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'ChatBot (Gemini)',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                DropdownButton<String>(
                  value: _selectedModel,
                  onChanged: _onModelChanged,
                  items: _models.map((model) {
                    return DropdownMenuItem<String>(
                      value: model['id'],
                      child: Text(
                        model['name']!,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                        ),
                      ),
                    );
                  }).toList(),
                  selectedItemBuilder: (context) {
                    return _models.map((model) {
                      return Center(
                        child: Text(
                          _models.firstWhere(
                              (m) => m['id'] == _selectedModel)['name']!,
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                      );
                    }).toList();
                  },
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                  icon: const Icon(
                    Icons.keyboard_arrow_down,
                    color: Colors.grey,
                    size: 16,
                  ),
                  underline: Container(),
                  dropdownColor: Colors.grey[900],
                  isDense: true,
                ),
              ],
            ),
          ),
        ),
        body: Stack(
          children: [
            // Main content
            AnimatedPadding(
              padding: EdgeInsets.only(left: _isSidebarOpen ? 200 : 0),
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              child: _buildMainContent(),
            ),
            // Sidebar
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              left: _isSidebarOpen ? 0 : -200,
              top: 0,
              bottom: 0,
              child: Container(
                width: 200,
                color: Colors.grey[900],
                child: _buildSidebar(),
              ),
            ),
          ],
        ),
        bottomNavigationBar: _buildBottomBar(),
      ),
    );
  }

  Widget _buildMainContent() {
    return Column(
      children: [
        if (_selectedChat == null || _selectedChat!.messages.isEmpty)
          Expanded(
            child: Center(
              child: RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'Hello Sajudin,\n',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        foreground: Paint()
                          ..shader = LinearGradient(
                            colors: [Colors.blue, Colors.purple],
                          ).createShader(
                            Rect.fromLTWH(0, 0, 200, 70),
                          ),
                      ),
                    ),
                    TextSpan(
                      text: 'What you wanna ask?',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        foreground: Paint()
                          ..shader = LinearGradient(
                            colors: [Colors.blue, Colors.purple],
                          ).createShader(
                            Rect.fromLTWH(0, 0, 200, 70),
                          ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _selectedChat!.messages.length,
              itemBuilder: (context, index) {
                final message = _selectedChat!.messages[index];
                return Align(
                  alignment: message.isUserMessage
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.7,
                    ),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: message.isUserMessage
                          ? Colors.blue
                          : Colors.grey[900],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: message.isUserMessage
                          ? CrossAxisAlignment.end
                          : CrossAxisAlignment.start,
                      children: [
                        Text(
                          message.content,
                          style: const TextStyle(
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          message.timestamp.toString().substring(11, 16),
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: CircularProgressIndicator(),
          ),
      ],
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 300,
      color: Colors.grey[900],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: () {
                _createNewChat();
                setState(() {
                  _isSidebarOpen = false;
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                minimumSize: const Size.fromHeight(45),
              ),
              child: const Text('New Chat'),
            ),
          ),
          Expanded(
            child: ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _chatHistories.length,
              itemBuilder: (context, index) {
                final chat = _chatHistories[index];
                return ListTile(
                  title: Text(
                    chat.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: chat.id == _selectedChat?.id
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text(
                    DateFormat('EEE, M/d/y').format(chat.createdAt),
                    style: TextStyle(color: Colors.grey[400]),
                  ),
                  selected: chat.id == _selectedChat?.id,
                  selectedTileColor: Colors.white,
                  onTap: () => _selectChat(chat),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.grey[900],
                hintText: 'Ask Gemini',
                hintStyle: TextStyle(
                  color: Colors.grey[500],
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
              style: const TextStyle(
                color: Colors.white,
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _isLoading ? null : _sendMessage,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: Icon(
                Icons.send,
                color: _isLoading ? Colors.grey : Colors.black,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
