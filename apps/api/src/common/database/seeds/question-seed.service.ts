import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionTab } from '../../../support/entities/question-tab.entity';
import { QuestionAnswer } from '../../../support/entities/question-answer.entity';

@Injectable()
export class QuestionSeedService {
  constructor(
    @InjectRepository(QuestionTab)
    private readonly questionTabRepository: Repository<QuestionTab>,
    @InjectRepository(QuestionAnswer)
    private readonly questionAnswerRepository: Repository<QuestionAnswer>,
  ) {}

  async run(): Promise<void> {
    console.info('Seeding Support Questions and Tabs...');

    // 1. Create Tabs
    const tabsData = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Geral',
        description: 'Dúvidas gerais sobre a plataforma',
        icon: 'info',
        index: 1,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Acessos e Contas',
        description: 'Problemas de acesso e configuração de contas',
        icon: 'account_circle',
        index: 2,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Funcionalidades',
        description: 'Uso das ferramentas e recursos',
        icon: 'build',
        index: 3,
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Relatórios e Dados',
        description: 'Dúvidas sobre relatórios, exportação e análise de dados',
        icon: 'bar_chart',
        index: 4,
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Integrações',
        description: 'Configuração de integrações com outros sistemas',
        icon: 'link',
        index: 5,
      }, // This tab will have NO answers
    ];

    for (const tabData of tabsData) {
      const existingTab = await this.questionTabRepository.findOne({
        where: { id: tabData.id },
      });
      if (existingTab) {
        await this.questionTabRepository.update(tabData.id, tabData);
      } else {
        await this.questionTabRepository.save(
          this.questionTabRepository.create(tabData),
        );
      }
    }

    const tabs = await this.questionTabRepository.find();
    const geralTab = tabs.find((t) => t.name === 'Geral');
    const acessosTab = tabs.find((t) => t.name === 'Acessos e Contas');
    const funcTab = tabs.find((t) => t.name === 'Funcionalidades');
    const relatoriosTab = tabs.find((t) => t.name === 'Relatórios e Dados');

    // 2. Create Answers
    const answersData = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        question: 'O que é o Urbis?',
        answer:
          'O Urbis é uma plataforma inovadora voltada para a gestão territorial inteligente e otimização de dados georreferenciados.',
        index: 1,
        apps: [
          'web',
          'accounts',
          'site',
          'docs',
          'mosaico',
          'mapa',
          'viabiliza',
          'legis',
        ],
        tabs: [geralTab],
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        question: 'Como faço para recuperar a minha senha?',
        answer:
          'Na página de login, clique em "Esqueci minha senha" e siga as instruções enviadas para o seu e-mail de cadastro.',
        index: 2,
        apps: ['accounts', 'site'],
        tabs: [geralTab, acessosTab],
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        question: 'É possível exportar os dados do Mapa para PDF?',
        answer:
          'Sim! Utilize a ferramenta de impressão localizada no canto superior direito do Mapa para exportar as visualizações.',
        index: 3,
        apps: ['mapa', 'web'],
        tabs: [funcTab, relatoriosTab],
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        question: 'Onde encontro a documentação da API?',
        answer:
          'A documentação da API pode ser encontrada na plataforma Docs, ou clicando no ícone de ajuda dentro de sua conta.',
        index: 4,
        apps: ['docs', 'accounts'],
        tabs: [funcTab],
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        question: 'Como gerar um relatório de zoneamento?',
        answer:
          'Acesse o Viabiliza e insira o endereço desejado. Na aba de resultados, haverá um botão para gerar o relatório detalhado de zoneamento.',
        index: 5,
        apps: ['viabiliza'],
        tabs: [relatoriosTab],
      },
    ];

    for (const answerData of answersData) {
      const existingAnswer = await this.questionAnswerRepository.findOne({
        where: { id: answerData.id },
        relations: ['tabs'],
      });

      if (existingAnswer) {
        // Filter out undefined tabs just in case
        const validTabs = answerData.tabs.filter((t) => t !== undefined);
        existingAnswer.question = answerData.question;
        existingAnswer.answer = answerData.answer;
        existingAnswer.index = answerData.index;
        existingAnswer.apps = answerData.apps;
        existingAnswer.tabs = validTabs;
        await this.questionAnswerRepository.save(existingAnswer);
      } else {
        const validTabs = answerData.tabs.filter((t) => t !== undefined);
        const newAnswer = this.questionAnswerRepository.create({
          id: answerData.id,
          question: answerData.question,
          answer: answerData.answer,
          index: answerData.index,
          apps: answerData.apps,
          tabs: validTabs,
        });
        await this.questionAnswerRepository.save(newAnswer);
      }
    }
  }
}
