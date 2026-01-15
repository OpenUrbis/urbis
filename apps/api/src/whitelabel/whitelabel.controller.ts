import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
} from '@nestjs/common';
import { WhitelabelService } from './whitelabel.service';
import { ApplicationName } from './enums/application-name.enum';
import { UpdateWhitelabelDto } from './dto/update-whitelabel.dto';

@Controller({
  path: 'whitelabel',
})
export class WhitelabelController {
  constructor(private readonly service: WhitelabelService) {}

  @Get(':organizationId/:application')
  async getOrganizationWhitelabel(
    @Param('organizationId') organizationId: string,
    @Param('application', new ParseEnumPipe(ApplicationName))
    applicationName: ApplicationName,
  ) {
    return this.service.getOrganizationWhitelabel(
      organizationId,
      applicationName,
    );
  }

  @Get(':organizationId/:application/unified')
  async getUnifiedOrganizationWhitelabel(
    @Param('organizationId') organizationId: string,
    @Param('application', new ParseEnumPipe(ApplicationName))
    applicationName: ApplicationName,
  ) {
    return this.service.getUnifiedOrganizationWhitelabel(
      organizationId,
      applicationName,
    );
  }

  @Put(':organizationId/:application')
  async updateOrganizationWhitelabel(
    @Param('organizationId') organizationId: string,
    @Param('application', new ParseEnumPipe(ApplicationName))
    applicationName: ApplicationName,
    @Body() dto: UpdateWhitelabelDto,
  ) {
    await this.service.updateWhitelabel(organizationId, applicationName, dto);
    return this.service.getUnifiedOrganizationWhitelabel(
      organizationId,
      applicationName,
    );
  }
}
