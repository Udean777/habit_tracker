import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:uuid/uuid.dart';

import 'package:the_habits/core/providers/chat_repository_provider.dart';
import 'package:the_habits/presentation/chatbot/models/chat_history.dart';
import 'package:the_habits/presentation/chatbot/models/chat_message.dart';
import 'package:the_habits/presentation/chatbot/models/chat_models.dart';
import 'package:the_habits/presentation/chatbot/repositories/chat_repository.dart';
import 'package:the_habits/presentation/chatbot/widgets/bottom_bar.dart';
import 'package:the_habits/presentation/chatbot/widgets/main_content.dart';
import 'package:the_habits/presentation/chatbot/widgets/sidebar.dart';

class ChatPage extends StatefulHookConsumerWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  // Kontroler
  final TextEditingController _textController = TextEditingController();

  // Variabel state
  final List<ChatHistory> _chatHistories = [];
  ChatHistory? _selectedChat;
  bool _isLoading = false;
  bool _isSidebarOpen = false;
  bool _isInitialized = false;
  String _selectedModel = 'gemini-2.0-flash-exp';

  // Dependensi
  late final ChatRepository chatRepository;
  late final ChatSession chat;

  // Konstanta
  final List<Map<String, String>> _models = const [
    {'id': 'gemini-2.0-flash-exp', 'name': '2.0 Flash (Experimental)'},
    {'id': 'gemini-1.5-flash-8b', 'name': '1.5 Flash'},
  ];

  final model = GenerativeModel(
    model: 'gemini-2.0-flash-exp',
    apiKey: dotenv.env['GEMINI_API_KEY']!,
  );

  @override
  void initState() {
    super.initState();
    _initializeRepository();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  // Inisialisasi repository dan memuat chat
  Future<void> _initializeRepository() async {
    chatRepository = ref.read(chatRepositoryProvider);

    if (!_isInitialized) {
      await chatRepository.init();
      _isInitialized = true;
    }

    await _loadChats();

    setState(() {
      _selectedChat = _chatHistories.isEmpty ? null : _chatHistories.first;
    });

    if (_chatHistories.isEmpty) {
      await _createNewChat();
    }
  }

  Future<void> _loadChats() async {
    final savedChats = await chatRepository.getAllChats();

    setState(() {
      _chatHistories.clear();
      _chatHistories.addAll(savedChats.map((savedChat) => ChatHistory(
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
          )));
    });
  }

  // Metode manajemen chat
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

    await chatRepository.saveChat(newChatHive);

    setState(() {
      _chatHistories.add(newChat);
      _selectedChat = newChat;
    });
  }

  Future<void> deleteChat(String chatId) async {
    try {
      if (!_isInitialized) {
        await _initializeRepository();
      }

      await chatRepository.deleteChat(chatId);
      await _loadChats();

      setState(() {
        _selectedChat = _chatHistories.isNotEmpty ? _chatHistories.first : null;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chat berhasil dihapus')),
        );
      }
    } catch (e) {
      debugPrint('Error deleting chat: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menghapus chat: $e')),
        );
      }
    }
  }

  void selectChat(ChatHistory chatHistory) {
    setState(() {
      _selectedChat =
          _chatHistories.firstWhere((chat) => chat.id == chatHistory.id);
      _isSidebarOpen = false;
    });
  }

  // Penanganan pesan
  Future<void> sendMessage() async {
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
        chatRepository.updateChatTitle(_selectedChat!.id, _selectedChat!.title);
      }
    });

    await chatRepository.addMessageToChat(_selectedChat!.id, newMessageHive);

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

        await chatRepository.addMessageToChat(_selectedChat!.id, aiMessageHive);
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

        await chatRepository.addMessageToChat(
            _selectedChat!.id, errorMessageHive);
      }
    }
  }

  // Metode UI
  void _onModelChanged(String? newModel) {
    if (newModel != null) {
      setState(() {
        _selectedModel = newModel;
      });
      debugPrint('Model changed to: $_selectedModel');
    }
  }

  Widget _buildAppBarTitle(ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'ChatBot (Gemini)',
            style: TextStyle(
              color: colorScheme.primary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          _buildModelDropdown(),
        ],
      ),
    );
  }

  Widget _buildModelDropdown() {
    return DropdownButton<String>(
      value: _selectedModel,
      onChanged: _onModelChanged,
      items: _models.map((model) {
        return DropdownMenuItem<String>(
          value: model['id'],
          child: Text(
            model['name']!,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
        );
      }).toList(),
      selectedItemBuilder: (context) {
        return _models.map((model) {
          return Center(
            child: Text(
              _models.firstWhere((m) => m['id'] == _selectedModel)['name']!,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          );
        }).toList();
      },
      style: const TextStyle(color: Colors.grey, fontSize: 14),
      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey, size: 16),
      underline: Container(),
      dropdownColor: Colors.grey[900],
      isDense: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => setState(() => _isSidebarOpen = !_isSidebarOpen),
          ),
          actions: const [Icon(Icons.more_horiz)],
          title: _buildAppBarTitle(colorScheme),
        ),
        body: Stack(
          children: [
            AnimatedPadding(
              padding: EdgeInsets.only(left: _isSidebarOpen ? 300 : 0),
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              child: MainContent(
                isLoading: _isLoading,
                selectedChat: _selectedChat,
              ),
            ),
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              left: _isSidebarOpen ? 0 : -300,
              top: 0,
              bottom: 0,
              child: Container(
                width: 300,
                color: Colors.grey[900],
                child: Sidebar(
                  chatHistories: _chatHistories,
                  onCreateNewChat: _createNewChat,
                  onSelectChat: selectChat,
                  selectedChat: _selectedChat,
                  onDeleteChat: deleteChat,
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: BottomBar(
          isLoading: _isLoading,
          onSendMessage: sendMessage,
          textController: _textController,
        ),
      ),
    );
  }
}
